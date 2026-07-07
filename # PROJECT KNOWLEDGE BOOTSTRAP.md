# PROJECT KNOWLEDGE BOOTSTRAP

Before performing any analysis, implementation, refactoring or architectural decision, you must load and understand the complete project knowledge base.

AGENT.md is the project's constitution, but it is intentionally concise and delegates specialized knowledge to companion documents.

These documents collectively define the project's source of truth.

You must continuously consult them throughout the project—not only once at startup.

---

## KNOWLEDGE BASE

The project knowledge base is composed of:

### 1. AGENT.md

Defines:

- mission
- operating philosophy
- engineering mindset
- execution protocol
- autonomous behavior
- product constitution
- permanent rules

---

### 2. PRODUCT.md

Defines:

- business vision
- target users
- product strategy
- MVP scope
- business priorities
- roadmap
- product decisions

Consult this document whenever a functional or business decision must be made.

---

### 3. ARCHITECTURE.md

Defines:

- system architecture
- backend architecture
- frontend architecture
- API conventions
- folder organization
- database architecture
- engineering standards
- scalability rules

Consult this document before implementing or modifying technical components.

---

### 4. DESIGN_SYSTEM.md

Defines:

- visual language
- UI components
- typography
- spacing
- color system
- interaction patterns
- landing page standards
- accessibility
- design consistency

Consult this document before implementing or modifying any interface.

---

### 5. HUMAN_CENTERED_UX.md

Defines:

- target users
- UX philosophy
- cognitive load reduction
- mobile-first principles
- accessibility
- onboarding
- interaction simplicity
- trust-building patterns

Consult this document whenever designing user flows or making UX decisions.

---

### 6. DEVELOPMENT.md

Defines:

- development workflow
- Definition of Done
- testing standards
- QA process
- deployment requirements
- release process
- engineering checklists

Consult this document before considering any feature complete.

---

### 7. TASKS.md

Defines:

- current backlog
- priorities
- completed work
- discovered issues
- future improvements

Consult this document before starting work.

Update it continuously throughout implementation.

---

# KNOWLEDGE HIERARCHY

When two documents appear to conflict, resolve them using the following priority:

AGENT.md

↓

PRODUCT.md

↓

ARCHITECTURE.md

↓

HUMAN_CENTERED_UX.md

↓

DESIGN_SYSTEM.md

↓

DEVELOPMENT.md

↓

TASKS.md

If uncertainty remains,

choose the solution that maximizes:

- business value
- user experience
- maintainability
- production readiness

---

# CONTINUOUS SYNCHRONIZATION

Do not read these documents only once.

Revisit them whenever:

- implementing a new feature;
- modifying architecture;
- redesigning a screen;
- making product decisions;
- introducing dependencies;
- refactoring modules;
- updating workflows.

Treat them as permanent project memory.

---

# SELF-UPDATING KNOWLEDGE BASE

Whenever your work changes the project,

update the relevant document immediately.

Examples:

Business changes
→ PRODUCT.md

Architecture changes
→ ARCHITECTURE.md

Design changes
→ DESIGN_SYSTEM.md

UX improvements
→ HUMAN_CENTERED_UX.md

Development process changes
→ DEVELOPMENT.md

Progress and backlog
→ TASKS.md

Core engineering principles
→ AGENT.md

Documentation must evolve with the product.

Never allow the knowledge base to become inconsistent with the implementation.

---

# GOLDEN RULE

Every implementation decision must be informed by the appropriate knowledge document before code is written.

The knowledge base is not documentation.

It is part of the engineering system itself.
