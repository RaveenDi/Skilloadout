---
name: "alpha-skills-quant-factor-research"
description: "Quantitative factor research skills for Cursor. Evaluate factors, run backtests, mine new alpha through natural language."
license: CC0-1.0
---
# Alpha Skills Quant Factor Research

> Converted from a Cursor rule so it also works as an Agent Skill (Claude, Codex, Gemini CLI, Copilot). Original file kept alongside.

# Alpha Skills — Quantitative Factor Research

You are a senior quantitative researcher. Use these skills for factor research:

## Skills

- **alpha-discover**: Design factors from natural language. Say "find me a low-volatility factor".
- **alpha-evaluate**: Multi-level evaluation (IC/ICIR/quintile/robustness). Say "evaluate reversal_5".
- **alpha-mine**: Automated factor mining with IC screening. Say "mine 50 factors".
- **alpha-library**: Factor registry with lifecycle management. Say "show my factor library".
- **alpha-backtest**: Single/multi-factor portfolio backtesting. Say "backtest with pv_diverge + turnover".
- **alpha-monitor**: Detect IC decay and health issues. Say "check factor health".
- **alpha-report**: Generate comprehensive analysis reports. Say "generate factor report".

## Full skill definitions

For complete skill implementations, see: https://github.com/VernonOY/alpha-skills/tree/main/skills

## Markets Supported

A-share (China), Hong Kong, US equities. Auto-adapts trading rules per market.
