const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// ANSI Colors
const c = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
};

const ICONS = {
    check: "✅",
    cross: "❌",
    warn: "⚠️ ",
};

console.log(`\n${c.bold}🛡️  PROMPTGUARD SYSTEM VITALS CHECK${c.reset}\n`);

const checks = [
    {
        name: "Runtime Environment",
        fn: () => {
            const nodeVersion = process.version;
            return { ok: true, msg: `Running on Node.js ${nodeVersion}` };
        },
    },
    {
        name: "Git Repository",
        fn: () => {
            try {
                execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
                return { ok: true, msg: "Git repo initialized" };
            } catch (e) {
                return { ok: false, msg: "Not a git repository" };
            }
        },
    },
    {
        name: "PromptGuard Directory",
        fn: () => {
            if (fs.existsSync(".promptguard")) {
                return { ok: true, msg: ".promptguard found" };
            }
            return { ok: false, msg: ".promptguard missing (run init)" };
        },
    },
    {
        name: "Configuration",
        fn: () => {
            if (fs.existsSync("promptguard.config.json")) {
                try {
                    JSON.parse(fs.readFileSync("promptguard.config.json", "utf-8"));
                    return { ok: true, msg: "Config valid" };
                } catch (e) {
                    return { ok: false, msg: "Config corrupted" };
                }
            }
            return { ok: true, msg: "Using defaults (no config file)" };
        },
    },
    {
        name: "Snapshot Storage",
        fn: () => {
            if (fs.existsSync(".promptguard/snapshots")) {
                return { ok: true, msg: "Snapshot storage ready" };
            }
            return { ok: false, msg: "Snapshot directory missing" }
        }
    }
];

let allPassed = true;

checks.forEach((check) => {
    const result = check.fn();
    if (!result.ok) allPassed = false;

    const icon = result.ok ? ICONS.check : ICONS.cross;
    const color = result.ok ? c.green : c.red;

    console.log(`${icon} ${c.bold}${check.name}:${c.reset}`);
    console.log(`   ${color}${result.msg}${c.reset}`);
});

console.log("\n" + "-".repeat(40) + "\n");

if (allPassed) {
    console.log(`${c.green}${c.bold}🚀 SYSTEM OPERATIONAL${c.reset}`);
    console.log(`${c.dim}Ready for demo recording.${c.reset}\n`);
    process.exit(0);
} else {
    console.log(`${c.red}${c.bold}💥 SYSTEM CHECKS FAILED${c.reset}`);
    console.log(`${c.dim}Please fix issues before recording.${c.reset}\n`);
    process.exit(1);
}
