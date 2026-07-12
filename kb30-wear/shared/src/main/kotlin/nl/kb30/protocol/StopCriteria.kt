package nl.kb30.protocol

/** Text and rules for the stop-criteria screen (KB30 hard rule #10). */
object StopCriteria {

    val titel = "Stop. Ga zitten."

    val tekst = "Stop de training. Ga zitten en rust. " +
        "Houdt de pijn op de borst aan? Bel 112."

    val naMeldingNl = "Kettlebells staan nu 48 uur op pauze. " +
        "Alleen rustige mobiliteit. Reset kan bij Instellingen, " +
        "na 'klachten weg / met arts besproken'."

    /** The symptoms shown on the pre-check and the pain screen. */
    val symptomen: List<StopSymptom> = StopSymptom.entries

    /**
     * The watch must never say "je hart is normaal, dus je bent veilig".
     * This is the only sanctioned wording near heart rate.
     */
    val hartslagDisclaimer = "Alleen ter informatie. " +
        "Niet gebruiken als medische beoordeling."

    val geenMeting = "Geen meting"
}
