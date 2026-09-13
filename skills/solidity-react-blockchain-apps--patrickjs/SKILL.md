---
name: "solidity-react-blockchain-apps"
description: "Cursor rules for Solidity development with React Blockchain apps integration."
license: CC0-1.0
---
# Solidity React Blockchain Apps

> Converted from a Cursor rule so it also works as an Agent Skill (Claude, Codex, Gemini CLI, Copilot). Original file kept alongside.

Solidity React Blockchain Apps Guidelines

- Prioritize secure Solidity smart contracts with explicit visibility, access control, and clear NatSpec documentation.
- Use established security tooling such as Slither, Mythril, and property-based tests for critical contract behavior.
- Prefer OpenZeppelin contracts for common primitives such as ownership, access control, multisig, and timelocks.
- Optimize gas deliberately by reviewing storage layout, function visibility, and unnecessary writes.
- Use pull-payment patterns, event logging, and defensive error handling for production-grade contracts.
- Keep Web3 frontend code type-safe and explicit when interacting with wallets, providers, and transactions.
