# Contributing to PromptGuard

Thank you for your interest in contributing! 🎉

## Quick Start

```bash
# Clone and install
git clone https://github.com/mediamarktatti-maker/promptguard
cd promptguard
bun install

# Run the dev server
bun run dev

# Run tests
bun run test
```

## How to Contribute

### Reporting Bugs

1. Check existing issues first
2. Create a new issue with:
   - Clear title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment info (OS, Bun version, etc.)

### Suggesting Features

1. Open a discussion or issue
2. Describe the use case
3. Explain how it fits with PromptGuard's goals

### Pull Requests

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `bun run test`
5. Run lint: `bun run lint`
6. Commit with clear message
7. Push and open a PR

## Code Style

- Use TypeScript
- Follow existing patterns
- Add tests for new features
- Keep functions small and focused
- Use descriptive variable names

## Core Principles

PromptGuard follows these principles:

1. **Deterministic** - Same input = same output, always
2. **Zero APIs** - No external dependencies for core functionality
3. **Fail-loud** - Clear errors, never silent failures
4. **Git-native** - Everything is just files

## Project Structure

```
tools/promptguard.ts    # CLI entry point
src/lib/promptguard.ts  # Core logic (shared by CLI + web)
src/components/         # React components
src/pages/              # Page components
```

## Questions?

Open an issue or start a discussion. We're happy to help!

---

Thanks for contributing! 🛡️
