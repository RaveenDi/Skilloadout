// Lightweight static safety scan for skill content. Skills are instructions + scripts an agent
// will execute, so we surface risky patterns on the site instead of silently shipping them.
// Findings are advisory: many legitimate skills install tools with `curl | sh`.

const RULES = [
  { id: "prompt-injection", severity: "high", re: /ignore (all |any )?(previous|prior|above) (instructions|prompts)|disregard (your|the) (system|previous) (prompt|instructions)/i, label: "Contains prompt-injection style text" },
  { id: "secret-exfil", severity: "high", re: /(~|\$HOME|%USERPROFILE%)[\\/](\.ssh[\\/]id_|\.aws[\\/]credentials|\.config[\\/]gh[\\/]hosts)/i, label: "References credential files (ssh keys / cloud credentials)" },
  { id: "obfuscated-exec", severity: "high", re: /(base64\s+(-d|--decode)[^\n]{0,80}\|\s*(ba|z)?sh)|eval\s*\(\s*atob\s*\(|exec\(\s*base64\.b64decode/i, label: "Executes obfuscated / base64-encoded code" },
  { id: "miner", severity: "high", re: /\b(xmrig|coinhive|cryptonight)\b/i, label: "Mentions crypto-miner software" },
  { id: "destructive", severity: "medium", re: /rm\s+-rf\s+(\/|~|\$HOME)(\s|$|\*)|format\s+c:|mkfs\.\w+\s+\/dev\/sd/i, label: "Contains destructive filesystem commands" },
  { id: "pipe-to-shell", severity: "low", re: /(curl|wget)\s[^\n|]{0,200}\|\s*(sudo\s+)?(ba|z)?sh\b|iwr\s[^\n|]{0,200}\|\s*iex/i, label: "Pipes a remote script into a shell (review before running)" },
  { id: "disable-safety", severity: "medium", re: /--dangerously-skip-permissions|--no-verify\b|--yolo\b/i, label: "Disables agent/tool safety checks" },
];

export function scanSafety(text) {
  const findings = [];
  for (const r of RULES) {
    if (r.re.test(text)) findings.push({ id: r.id, severity: r.severity, label: r.label });
  }
  return findings;
}
