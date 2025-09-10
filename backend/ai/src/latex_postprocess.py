import re
import unicodedata

MATH_BLOCK_RE = re.compile(
    r"(\\\((?:.|\n)*?\\\))"
    r"|"
    r"(\\\[(?:.|\n)*?\\\])"
    r"|"
    r"(\$\$(?:.|\n)*?\$\$)"
    r"|"
    r"(\$(?:.|\n)*?\$)",
    re.S,
)
CMD_RE = re.compile(r"\\[A-Za-z]+(?:\s*\{[^{}]*\}|[A-Za-z])?")

def _inside_any(span_list, idx):
    for a, b in span_list:
        if a <= idx < b:
            return True
    return False

def normalize_latex_core(s: str) -> str:
    s = re.sub(r"\$\$(.*?)\$\$", r"\\[\1\\]", s, flags=re.S)

    s = re.sub(r"\\\\([A-Za-z])", r"\\\1", s)
    s = re.sub(r"\\\\([()\[\]])", r"\\\1", s)

    s = re.sub(r"\\boldsymbol\s*\{?\s*([A-Za-z])\s*\}?", r"\\vec{\1}", s)
    s = re.sub(r"\\mathbf\s*\{?\s*([A-Za-z])\s*\}?", r"\\vec{\1}", s)
    s = re.sub(r"\\vec\s+([A-Za-z])", r"\\vec{\1}", s)

    spans = [(m.start(), m.end()) for m in MATH_BLOCK_RE.finditer(s)]
    out, last = [], 0
    for m in CMD_RE.finditer(s):
        i = m.start()
        token = m.group()

        if _inside_any(spans, i):
            continue
        if token in (r"\(", r"\)", r"\[", r"\]"):
            continue

        out.append(s[last:i])
        out.append(r"\(" + token + r"\)")
        last = m.end()
    out.append(s[last:])
    s = "".join(out)
    return s

UNICODE_TO_TEX = {
    "∑": r"\sum", "∏": r"\prod", "∫": r"\int", "√": r"\sqrt{}",
    "∞": r"\infty", "∂": r"\partial", "·": r"\cdot", "×": r"\times", "÷": r"\div",
    "≤": r"\leq", "≥": r"\geq", "≠": r"\ne", "≈": r"\approx", "≃": r"\simeq", "≅": r"\cong",
    "→": r"\to", "⇒": r"\Rightarrow", "↦": r"\mapsto", "←": r"\leftarrow", "⇔": r"\Leftrightarrow",
    "∈": r"\in", "∉": r"\notin", "∅": r"\varnothing",
    "∩": r"\cap", "∪": r"\cup", "⊂": r"\subset", "⊆": r"\subseteq", "⊃": r"\supset", "⊇": r"\supseteq",
    "∧": r"\land", "∨": r"\lor", "¬": r"\lnot", "∀": r"\forall", "∃": r"\exists", "∄": r"\nexists",
    "ℝ": r"\mathbb{R}", "ℤ": r"\mathbb{Z}", "ℕ": r"\mathbb{N}", "ℚ": r"\mathbb{Q}", "ℂ": r"\mathbb{C}",
    "α": r"\alpha", "β": r"\beta", "γ": r"\gamma", "Γ": r"\Gamma",
    "δ": r"\delta", "Δ": r"\Delta", "ε": r"\varepsilon", "ϵ": r"\epsilon",
    "ζ": r"\zeta", "η": r"\eta", "θ": r"\theta", "Θ": r"\Theta",
    "ι": r"\iota", "κ": r"\kappa", "λ": r"\lambda", "Λ": r"\Lambda",
    "μ": r"\mu", "ν": r"\nu", "ξ": r"\xi", "Ξ": r"\Xi",
    "π": r"\pi", "Π": r"\Pi", "ρ": r"\rho", "σ": r"\sigma", "Σ": r"\Sigma",
    "τ": r"\tau", "φ": r"\varphi", "ϕ": r"\phi", "Φ": r"\Phi",
    "χ": r"\chi", "ψ": r"\psi", "Ψ": r"\Psi", "ω": r"\omega", "Ω": r"\Omega",
    "−": "-",
}
UNICODE_RE = re.compile("|".join(map(re.escape, UNICODE_TO_TEX.keys())))
def unicode_to_latex(text: str) -> str:
    return UNICODE_RE.sub(lambda m: UNICODE_TO_TEX[m.group(0)], text)

SINGLE_DOLLAR_INLINE_RE = re.compile(r"(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)", re.S)
def convert_single_dollar_inline(s: str) -> str:
    return SINGLE_DOLLAR_INLINE_RE.sub(r"\\(\1\\)", s)

def _brace_simple_exponents_and_subscripts(block: str) -> str:
    block = re.sub(r"\^([A-Za-z0-9])", r"^{\1}", block)
    block = re.sub(r"_([A-Za-z0-9])", r"_{\1}", block)
    return block

def _fix_sum_prod_ranges(block: str) -> str:
    block = re.sub(r"(\b\w+)\s*\\sum\s*([A-Za-z])\s*=\s*([-\w]+)", r"\\sum_{\2=\3}^{\1}", block)
    block = re.sub(r"(\b\w+)\s*\\prod\s*([A-Za-z])\s*=\s*([-\w]+)", r"\\prod_{\2=\3}^{\1}", block)
    block = re.sub(r"\\sum\s*([A-Za-z])\s*=\s*([-\w]+)\s*\^\s*([-\w]+)", r"\\sum_{\1=\2}^{\3}", block)
    block = re.sub(r"\\prod\s*([A-Za-z])\s*=\s*([-\w]+)\s*\^\s*([-\w]+)", r"\\prod_{\1=\2}^{\3}", block)
    return block

def _fix_minus_one_power(block: str) -> str:
    block = re.sub(r"\(-1\)\s*([A-Za-z])\s*\+\s*([0-9]+)", r"(-1)^{\1+\2}", block)
    block = re.sub(r"\(-1\)\s*\^\s*([A-Za-z])\s*\+\s*([0-9]+)", r"(-1)^{\1+\2}", block)
    block = re.sub(r"\(-1\)\s*([A-Za-z])", r"(-1)^{\1}", block)
    return block

def _fix_matrix_minors_and_symbols(block: str) -> str:
    block = re.sub(r"\b([Aa])\s*([a-z])\s*(\d+)\b", r"\1_{\2\3}", block)
    block = re.sub(r"\b([Aa])([a-z])(\d+)\b", r"\1_{\2\3}", block)
    block = re.sub(r"(?<!\\)\bdet\b", r"\\det", block)
    block = re.sub(r"\bL\s*n\s*(?=\()", r"L_n", block)
    block = re.sub(r"\bLn(?=\()", r"L_n", block)
    return block

ENGLISH_TO_TEX_IN_MATH = {
    "in": r"\in",
    "ne": r"\ne",
    "prod": r"\prod",
    "sum": r"\sum",
    "alpha": r"\alpha", "beta": r"\beta", "gamma": r"\gamma", "Gamma": r"\Gamma",
    "delta": r"\delta", "Delta": r"\Delta", "epsilon": r"\epsilon", "varepsilon": r"\varepsilon",
    "theta": r"\theta", "Theta": r"\Theta", "lambda": r"\lambda", "Lambda": r"\Lambda",
    "pi": r"\pi", "Pi": r"\Pi", "rho": r"\rho", "sigma": r"\sigma", "Sigma": r"\Sigma",
    "phi": r"\phi", "varphi": r"\varphi", "omega": r"\omega", "Omega": r"\Omega",
}
ENGLISH_WORD_RE = re.compile(r"\b([A-Za-z]+)\b")

def _english_to_tex_inside_math(block: str) -> str:
    def repl(m: re.Match) -> str:
        w = m.group(1)
        if w == "sgn":
            return r"\operatorname{sgn}"
        return ENGLISH_TO_TEX_IN_MATH.get(w, w)
    return ENGLISH_WORD_RE.sub(repl, block)

def _targeted_sigma_in_sum(block: str) -> str:
    block = re.sub(r"(\\sum_\{)\s*o\s*(?=\\in)", r"\1\\sigma", block)
    block = re.sub(r"(\\sum_\{)\s*o\s*(?=in)", r"\1\\sigma", block)
    block = re.sub(r"(?<=\\in\s)S\s*([A-Za-z])\b", r"S_{\1}", block)
    return block

def _fix_ellipsis(block: str) -> str:
    return re.sub(r"(?<!\.)\.\.\.(?!\.)", r"\\cdots", block)

ASTERISK_BETWEEN_TOKENS_RE = re.compile(r"(?<=\S)\s*\\?\*\s*(?=\S)")
def _fix_ascii_times(block: str) -> str:
    return ASTERISK_BETWEEN_TOKENS_RE.sub(r" \\cdot ", block)

PAREN_DIV_RE = re.compile(r"\(\s*([^()]+?)\s*\)\s*/\s*\(\s*([^()]+?)\s*\)")
BRACK_DIV_RE = re.compile(r"\[\s*([^\[\]]+?)\s*\]\s*/\s*\[\s*([^\[\]]+?)\s*\]")
def _slash_to_frac(block: str) -> str:
    changed = True
    while changed:
        new = PAREN_DIV_RE.sub(r"\\frac{\1}{\2}", block)
        new = BRACK_DIV_RE.sub(r"\\frac{\1}{\2}", new)
        changed = (new != block)
        block = new
    return block

def _align_indices_with_k_plus_i(block: str) -> str:
    if re.search(r"\(-?1\)\s*\^\s*\{?(?:k\+i|i\+k)\}?", block):
        block = re.sub(r"([aA])_\{\s*k\s*1\s*\}", r"\1_{ki}", block)
        block = re.sub(r"([aA])_\{\s*1\s*k\s*\}", r"\1_{ik}", block)
        block = re.sub(r"([aA])\s*_\s*k1\b", r"\1_{ki}", block)
        block = re.sub(r"([aA])\s*_\s*1k\b", r"\1_{ik}", block)
    return block

def _fix_inside_math(block: str) -> str:
    block = _english_to_tex_inside_math(block)
    block = _targeted_sigma_in_sum(block)
    block = _slash_to_frac(block)
    block = _fix_ascii_times(block)
    block = _align_indices_with_k_plus_i(block)
    block = _fix_sum_prod_ranges(block)
    block = _fix_minus_one_power(block)
    block = _fix_matrix_minors_and_symbols(block)
    block = _brace_simple_exponents_and_subscripts(block)
    block = _fix_ellipsis(block)
    return block

def _repair_math_blocks(s: str) -> str:
    def repl(m: re.Match) -> str:
        return _fix_inside_math(m.group(0))
    return MATH_BLOCK_RE.sub(repl, s)

CMD_ANY_RE = re.compile(
    r"\\(sum|prod|int|frac|sqrt|binom|det|cdot|times|leq|geq|neq|infty|alpha|beta|gamma|delta|pi|lambda|sigma)\b"
)
WORD_RE = re.compile(r"[A-Za-z]{2,}")
UNICODE_MATH_RE = re.compile(r"[∑∏∫√≤≥≠×·→↦⇔ℝℤℕℚℂ]")

INLINE_ONE_CMD = re.compile(r"\\\(\s*(\\[A-Za-z]+(?:\s*\{[^{}]*\})?)\s*\\\)")
INLINE_SIMPLE_TOKEN = re.compile(r"\\\(\s*([A-Za-z0-9=+\-*/.,])\s*\\\)")

def _strip_trivial_inline_wrappers(line: str) -> str:
    line = INLINE_ONE_CMD.sub(lambda m: m.group(1), line)
    line = INLINE_SIMPLE_TOKEN.sub(lambda m: m.group(1), line)
    return line

def _is_prose_heavy(line: str) -> bool:
    tmp = re.sub(r"\\[A-Za-z]+(\s*\{[^{}]*\})?", " ", line)
    words = WORD_RE.findall(tmp)
    return len(words) >= 8 or sum(len(w) for w in words) >= 30

def _is_formula_like(line: str) -> bool:
    cmd_count = len(CMD_ANY_RE.findall(line))
    uni_count = len(UNICODE_MATH_RE.findall(line))
    has_eq = "=" in line
    sym_count = len(re.findall(r"[+\-*/=^_]", line))

    if cmd_count >= 2:
        return True
    if any(tok in line for tok in (r"\sum", r"\prod", r"\int", r"\frac", r"\sqrt")):
        return True
    if (uni_count >= 1 and has_eq):
        return True
    if re.search(r"^\s*det\b", line) and (has_eq or sym_count >= 2 or uni_count >= 1):
        return True
    if sym_count >= 4 and cmd_count >= 1:
        return True
    if len(re.findall(r"_[{].*?[}]|[\^][{].*?[}]", line)) >= 2:
        return True
    return False

def wrap_mathy_lines(s: str) -> str:
    out = []
    for raw_line in s.splitlines():
        line = raw_line.rstrip("\n")

        line = _strip_trivial_inline_wrappers(line)

        mblocks = list(MATH_BLOCK_RE.finditer(line))
        has_nontrivial = any(len(m.group(0)) > 6 and re.search(r"[{}_^\\=]", m.group(0)) for m in mblocks)
        if has_nontrivial:
            out.append(line)
            continue

        if _is_prose_heavy(line) or not line.strip():
            out.append(line)
            continue

        if _is_formula_like(line):
            out.append(r"\[" + line.strip() + r"\]")
        else:
            out.append(line)
    return "\n".join(out)

CMD_FULL_RE = re.compile(r"\\([A-Za-z]+)(?:\s*\{[^{}]*\})?")
INLINE_CMD_WHITELIST = {
    "times", "cdot", "leq", "geq", "neq", "approx", "sim",
    "in", "notin", "subset", "subseteq", "supset", "supseteq",
    "cup", "cap", "to", "leftarrow", "Rightarrow", "Leftrightarrow",
    "det"
}
def inline_wrap_prose_tokens(s: str) -> str:
    spans = [(m.start(), m.end()) for m in MATH_BLOCK_RE.finditer(s)]
    def inside(i):
        for a, b in spans:
            if a <= i < b:
                return True
            return False

    def repl(m: re.Match) -> str:
        name = m.group(1)
        if any(a <= m.start() < b for a, b in spans):
            return m.group(0)
        if name in INLINE_CMD_WHITELIST:
            return r"\(" + m.group(0) + r"\)"
        return m.group(0)

    return CMD_FULL_RE.sub(repl, s)

def enforce_tex(raw_text: str) -> str:
    txt = unicodedata.normalize("NFC", raw_text)

    txt = unicode_to_latex(txt)

    txt = convert_single_dollar_inline(txt)

    txt = normalize_latex_core(txt)

    txt = wrap_mathy_lines(txt)

    txt = _repair_math_blocks(txt)

    txt = inline_wrap_prose_tokens(txt)

    txt = unicodedata.normalize("NFC", txt)
    return txt
