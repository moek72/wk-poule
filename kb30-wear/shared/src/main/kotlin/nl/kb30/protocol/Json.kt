package nl.kb30.protocol

/**
 * A tiny, dependency-free JSON reader/writer.
 *
 * The Wear <-> phone protocol only exchanges small, flat payloads (objects with
 * string / number / boolean / null values, plus short arrays of the same or of
 * nested objects). A full JSON library would be overkill and — more importantly —
 * would pull a dependency into the safety-critical shared module, which we keep
 * stdlib-only so its tests run on any bare JVM.
 *
 * Supported value types: String, Boolean, Long, Double, null, List<Any?>,
 * Map<String, Any?>. Numbers are parsed as Long when integral, otherwise Double.
 */
object Json {

    fun encode(value: Any?): String {
        val sb = StringBuilder()
        write(sb, value)
        return sb.toString()
    }

    private fun write(sb: StringBuilder, value: Any?) {
        when (value) {
            null -> sb.append("null")
            is String -> writeString(sb, value)
            is Boolean -> sb.append(value.toString())
            is Int -> sb.append(value.toString())
            is Long -> sb.append(value.toString())
            is Double -> sb.append(if (value.isFinite()) value.toString() else "0")
            is Float -> sb.append(if (value.isFinite()) value.toString() else "0")
            is Map<*, *> -> {
                sb.append('{')
                var first = true
                for ((k, v) in value) {
                    if (!first) sb.append(',')
                    first = false
                    writeString(sb, k.toString())
                    sb.append(':')
                    write(sb, v)
                }
                sb.append('}')
            }
            is List<*> -> {
                sb.append('[')
                for ((i, v) in value.withIndex()) {
                    if (i > 0) sb.append(',')
                    write(sb, v)
                }
                sb.append(']')
            }
            else -> writeString(sb, value.toString())
        }
    }

    private fun writeString(sb: StringBuilder, s: String) {
        sb.append('"')
        for (c in s) {
            when (c) {
                '"' -> sb.append("\\\"")
                '\\' -> sb.append("\\\\")
                '\n' -> sb.append("\\n")
                '\r' -> sb.append("\\r")
                '\t' -> sb.append("\\t")
                else -> if (c < ' ') sb.append("\\u%04x".format(c.code)) else sb.append(c)
            }
        }
        sb.append('"')
    }

    fun decode(text: String): Any? = Parser(text).parseValue().also { /* trailing ignored */ }

    /** Convenience: decode a JSON object into a Map. Throws if the root is not an object. */
    @Suppress("UNCHECKED_CAST")
    fun decodeObject(text: String): Map<String, Any?> =
        decode(text) as? Map<String, Any?>
            ?: error("Expected JSON object")

    private class Parser(private val s: String) {
        private var i = 0

        fun parseValue(): Any? {
            skipWs()
            if (i >= s.length) error("Unexpected end of JSON")
            return when (s[i]) {
                '{' -> parseObject()
                '[' -> parseArray()
                '"' -> parseString()
                't', 'f' -> parseBool()
                'n' -> parseNull()
                else -> parseNumber()
            }
        }

        private fun parseObject(): Map<String, Any?> {
            expect('{')
            val map = LinkedHashMap<String, Any?>()
            skipWs()
            if (peek() == '}') { i++; return map }
            while (true) {
                skipWs()
                val key = parseString()
                skipWs()
                expect(':')
                map[key] = parseValue()
                skipWs()
                when (peek()) {
                    ',' -> { i++; continue }
                    '}' -> { i++; break }
                    else -> error("Expected ',' or '}' in object at $i")
                }
            }
            return map
        }

        private fun parseArray(): List<Any?> {
            expect('[')
            val list = ArrayList<Any?>()
            skipWs()
            if (peek() == ']') { i++; return list }
            while (true) {
                list.add(parseValue())
                skipWs()
                when (peek()) {
                    ',' -> { i++; continue }
                    ']' -> { i++; break }
                    else -> error("Expected ',' or ']' in array at $i")
                }
            }
            return list
        }

        private fun parseString(): String {
            expect('"')
            val sb = StringBuilder()
            while (i < s.length) {
                val c = s[i++]
                when (c) {
                    '"' -> return sb.toString()
                    '\\' -> {
                        val e = s[i++]
                        when (e) {
                            '"' -> sb.append('"')
                            '\\' -> sb.append('\\')
                            '/' -> sb.append('/')
                            'n' -> sb.append('\n')
                            'r' -> sb.append('\r')
                            't' -> sb.append('\t')
                            'b' -> sb.append('\b')
                            'f' -> sb.append('\u000C')
                            'u' -> {
                                val hex = s.substring(i, i + 4)
                                i += 4
                                sb.append(hex.toInt(16).toChar())
                            }
                            else -> sb.append(e)
                        }
                    }
                    else -> sb.append(c)
                }
            }
            error("Unterminated string")
        }

        private fun parseBool(): Boolean =
            if (s.startsWith("true", i)) { i += 4; true }
            else if (s.startsWith("false", i)) { i += 5; false }
            else error("Invalid literal at $i")

        private fun parseNull(): Any? {
            if (s.startsWith("null", i)) { i += 4; return null }
            error("Invalid literal at $i")
        }

        private fun parseNumber(): Any {
            val start = i
            if (peek() == '-') i++
            var isDouble = false
            while (i < s.length) {
                val c = s[i]
                if (c in '0'..'9') { i++ }
                else if (c == '.' || c == 'e' || c == 'E' || c == '+' || c == '-') { isDouble = true; i++ }
                else break
            }
            val token = s.substring(start, i)
            return if (isDouble) token.toDouble() else (token.toLongOrNull() ?: token.toDouble())
        }

        private fun skipWs() { while (i < s.length && s[i].isWhitespace()) i++ }
        private fun peek(): Char = if (i < s.length) s[i] else ' '
        private fun expect(c: Char) { if (peek() != c) error("Expected '$c' at $i"); i++ }
    }
}

/** Coerce a decoded JSON number to Int. */
fun Any?.asInt(default: Int = 0): Int = when (this) {
    is Long -> toInt()
    is Int -> this
    is Double -> toInt()
    is String -> toIntOrNull() ?: default
    else -> default
}

/** Coerce a decoded JSON number to Long. */
fun Any?.asLong(default: Long = 0L): Long = when (this) {
    is Long -> this
    is Int -> toLong()
    is Double -> toLong()
    is String -> toLongOrNull() ?: default
    else -> default
}

fun Any?.asBool(default: Boolean = false): Boolean = when (this) {
    is Boolean -> this
    is String -> this == "true"
    else -> default
}

fun Any?.asStr(default: String = ""): String = this?.toString() ?: default
