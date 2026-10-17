// listen.js — optionele spraakbesturing ("terugpraten") via SpeechRecognition.
//
// Standaard UIT. Alleen zichtbaar in Instellingen als de browser het kan.
// Werkt volledig lokaal via de ingebouwde browser-API (nl-NL). Degradeert
// netjes: knoppen blijven altijd werken; fouten zetten het gewoon stil.
//
// Commando's tijdens de training: "volgende" / "klaar", "pauze", "hervat" /
// "verder", "stop" (noodstop). Bij de samenvatting: "goed" / "twijfel" / "pijn".

const SR = (typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;

export const Listen = {
  supported: !!SR,
  active: false,
  _rec: null,
  _handler: null,
  _wanted: false,
  _onState: null,

  /** Meld-callback voor de luister-indicator in de UI. */
  onState(cb) { this._onState = cb; },
  _emit() { if (this._onState) { try { this._onState(this.active); } catch { /* ok */ } } },

  start(handler) {
    if (!this.supported) return;
    this._handler = handler;
    this._wanted = true;
    if (this.active) return;
    try {
      const rec = new SR();
      rec.lang = 'nl-NL';
      rec.continuous = true;
      rec.interimResults = false;
      rec.onresult = (e) => {
        try {
          const last = e.results[e.results.length - 1];
          const text = (last && last[0] && last[0].transcript || '').toLowerCase().trim();
          if (text && this._handler) this._handler(text);
        } catch { /* ok */ }
      };
      rec.onend = () => {
        this.active = false;
        this._emit();
        if (this._wanted) {
          try { rec.start(); this.active = true; this._emit(); } catch { /* ok */ }
        }
      };
      rec.onerror = (e) => {
        // Geen microfoon / geweigerd / geen service: netjes uitzetten.
        if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture')) {
          this._wanted = false;
          this.active = false;
          this._emit();
        }
      };
      rec.start();
      this._rec = rec;
      this.active = true;
      this._emit();
    } catch {
      this.active = false;
      this._emit();
    }
  },

  stop() {
    this._wanted = false;
    if (this._rec) { try { this._rec.stop(); } catch { /* ok */ } }
    this.active = false;
    this._emit();
  },
};

/** Vertaal een gesproken zin naar een commando (of null). */
export function parseCommand(text) {
  if (/\bstop\b/.test(text)) return 'stop';
  if (/\bpauze|pauzeer\b/.test(text)) return 'pauze';
  if (/\bhervat|verder|doorgaan\b/.test(text)) return 'hervat';
  if (/\bvolgende|klaar|gedaan\b/.test(text)) return 'volgende';
  if (/\bgoed|prima|lekker\b/.test(text)) return 'goed';
  if (/\btwijfel|matig\b/.test(text)) return 'twijfel';
  if (/\bpijn\b/.test(text)) return 'pijn';
  return null;
}
