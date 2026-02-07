# Changelog

All notable changes to **PromptGuard** will be documented in this file.

## [1.0.0] - 2026-01-30

### 🚀 Major Features
- **PromptGuard CLI v1.0**: The first deterministic, local-first prompt drift guard is now stable.
- **Premium CLI Visuals**: Added a custom, dependency-free color & box-drawing engine for beautiful terminal output.
  - Success/Error color coding.
  - Boxed summaries for `init` and `doctor` commands.
- **Web Dashboard & Demo**: A stunning local-first dashboard to visualize drift.
  - **Laser Scanning**: New animation visualizes checks in real-time.
  - **Confetti Celebration**: Rewards you for passing checks (because why not?).
  - **Konami Code**: Try `↑↑↓↓←→←→ba` on the landing page.

### ✨ Polish & "Vibe"
- **Dark Mode Default**: Optimized for modern developer aesthetics.
- **Fail Loud**: Errors now shake the screen and use high-contrast red styling.
- **Social Kit**: Added `SOCIAL_KIT.md` for easy sharing.
- **Documentation**: Added "Why I Built This" to README for personal narrative.

### 🛡️ Core Functionality
- **`init`**: Auto-discovers existing prompts in `prompts/`.
- **`snapshot`**: Creates named, hashed versions of prompts.
- **`diff`**: Semantic diffing for prompts (ignoring whitespace, focusing on content).
- **`check`**: Validates required headers and JSON schema locks.
- **`lock`**: Freezes JSON output schemas to prevent regression.
- **`doctor`**: Self-repair tool for configuration issues.

### 🐛 Bug Fixes
- Fixed duplicate function declaration in CLI.
- Fixed missing `npm install` lint warnings by correctly documenting setup.

---
*Built with ♥ for the Vibeathon.*
