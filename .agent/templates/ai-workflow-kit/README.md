# AI Workflow Starter Kit

> **Purpose:** Portable templates to standardize AI-assisted development across all your projects.
> **Author:** Augustas (KrissKross)
> **Created:** 2026-01-12

---

## What's Included

| File | Purpose | Copy To |
|------|---------|---------|
| `AGENTS.md` | Personal AI context & safety rules | Project root |
| `MAP.md` | File navigator for the AI | Project root |
| `STANDARDS.md` | Code standards & patterns | Project root |
| `VAULT.md` | Lessons learned & anti-patterns | Project root |
| `workflows/session-handoff.md` | Context preservation | `.agent/workflows/` |
| `workflows/push.md` | Git commit workflow | `.agent/workflows/` |
| `workflows/token-management.md` | Token budget tracking | `.agent/workflows/` |
| `scripts-README-template.md` | Scripts inventory template | `scripts/README.md` |
| `migrations-manifest-template.md` | DB migrations tracker | `docs/MIGRATIONS_MANIFEST.md` |

---

## Quick Setup for New Project

### Option 1: Copy All (Recommended)

```bash
# From your new project root:
cp -r /path/to/krisskross_AItooling/.agent/templates/ai-workflow-kit/. ./

# Then move files to correct locations:
mv AGENTS.md MAP.md STANDARDS.md VAULT.md ./
mkdir -p .agent/workflows
mv workflows/* .agent/workflows/
mv scripts-README-template.md scripts/README.md
mkdir -p docs
mv migrations-manifest-template.md docs/MIGRATIONS_MANIFEST.md
```

### Option 2: Use the Setup Script

```bash
# From your new project root:
bash /path/to/krisskross_AItooling/.agent/templates/ai-workflow-kit/setup.sh
```

---

## Customization Checklist

After copying, update these project-specific sections:

### AGENTS.md
- [ ] Update "Projects" section with your project name
- [ ] Adjust tech stack if different
- [ ] Customize "Commands" section for your scripts

### MAP.md
- [ ] Update all file paths for your project structure
- [ ] Add your key components and API routes
- [ ] Update the "Logic & Integrations" section

### STANDARDS.md
- [ ] Adjust framework if not Next.js
- [ ] Update icon library if different
- [ ] Add project-specific patterns

### VAULT.md
- [ ] Start fresh or copy relevant lessons
- [ ] Add project-specific guardrails

### scripts/README.md
- [ ] Inventory your actual scripts
- [ ] Categorize by Active/Deprecated/Debug
- [ ] Update the Quick Reference table

### docs/MIGRATIONS_MANIFEST.md
- [ ] List your actual migrations
- [ ] Update applied dates
- [ ] Adjust schema reference for your tables

---

## Best Practices

1. **Keep files in sync:** When you learn something new, update VAULT.md
2. **Review before sessions:** Point AI to MAP.md first for navigation
3. **Use handoffs:** Create handoff notes when ending complex work
4. **Track migrations:** Update manifest after every schema change
5. **Audit scripts:** Monthly cleanup of deprecated scripts

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-12 | Initial kit created from krisskross_AItooling patterns |

