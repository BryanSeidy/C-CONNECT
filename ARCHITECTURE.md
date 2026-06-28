# SOFTWARE ARCHITECTURE, ENGINEERING STANDARDS & IMPLEMENTATION RULES

---

# CORE ENGINEERING PRINCIPLES

Every implementation must follow software engineering best practices.

Never write code only to make something work.

Write code that another senior engineer would enjoy maintaining.

The codebase must be:

- scalable
- maintainable
- readable
- modular
- secure
- testable
- documented
- production-ready

Whenever a tradeoff exists, prioritize long-term maintainability.

---

# ARCHITECTURE PRINCIPLES

The architecture must clearly separate concerns.

Business logic must never leak into UI components.

Frontend must only orchestrate presentation and interactions.

Backend must encapsulate business rules.

Database must remain a persistence layer.

Architecture should naturally evolve without massive refactoring.

Prefer:

Presentation Layer

↓

Application Layer

↓

Domain Layer

↓

Infrastructure Layer

Avoid tightly coupled modules.

Prefer dependency inversion whenever possible.

---

# FRONTEND ENGINEERING STANDARDS

The frontend must feel like a premium SaaS.

Structure must remain predictable.

Prefer:

/components

/features

/hooks

/lib

/services

/providers

/utils

/types

/styles

/assets

Every component must have a single responsibility.

Avoid components exceeding roughly 250 lines unless fully justified.

Extract reusable logic into hooks.

Avoid duplicated JSX.

Avoid inline business logic.

Avoid inline styles unless absolutely necessary.

---

# COMPONENT DESIGN

Every component should be:

Reusable

Composable

Accessible

Responsive

Typed

Documented

Predictable

Self-contained

Prefer composition over inheritance.

Small focused components are preferred over large monolithic ones.

---

# STATE MANAGEMENT

Use the smallest state scope possible.

Order of preference:

Local State

↓

Context

↓

Server State

↓

Global State

Do not introduce global state unnecessarily.

Server state should always use an optimized query layer.

Caching must be intentional.

Invalidation must be predictable.

---

# DATA FETCHING

Every request must include:

Loading state

Error state

Success state

Empty state

Retry strategy

Timeout handling

Offline fallback whenever applicable

Avoid waterfall requests.

Parallelize independent requests.

Cache intelligently.

Prevent duplicate requests.

---

# FORM ENGINEERING

Every form must include:

client validation

server validation

real-time validation

clear feedback

loading indicator

disabled submit while processing

error summary

field-level errors

success confirmation

preserved values after validation failure

Forms should feel responsive and forgiving.

---

# ERROR HANDLING

Errors must never expose internal details.

Users should receive:

clear

actionable

human-readable

context-aware messages.

Developers should receive:

structured logs

stack traces

request identifiers

context information.

Separate developer logs from user messages.

---

# BACKEND ENGINEERING STANDARDS

Business logic belongs in services.

Controllers should remain thin.

Never place complex business rules inside controllers.

Every endpoint must be:

validated

authenticated

authorized

logged

rate-limited when necessary

versionable

predictable

REST conventions must remain consistent.

---

# API DESIGN

APIs should be:

consistent

typed

documented

versioned

predictable

Responses should follow a unified structure.

Example:

success

message

data

meta

errors

Avoid inconsistent payloads.

Use proper HTTP status codes.

---

# VALIDATION

Never trust frontend validation.

Validate every incoming request.

Validate:

type

length

format

ownership

authorization

business constraints

Reject invalid data early.

---

# AUTHENTICATION

Authentication must be secure.

Support:

secure password hashing

token expiration

refresh mechanisms

remember sessions

logout everywhere

session invalidation

password reset

email verification

Never expose sensitive information.

---

# AUTHORIZATION

Permissions must be explicit.

Never rely on hidden frontend controls.

Every protected resource must verify ownership.

Role checks must exist on the server.

Never trust client-side permissions.

---

# DATABASE ENGINEERING

Schema must remain normalized unless justified.

Naming conventions must remain consistent.

Use:

foreign keys

constraints

indexes

timestamps

soft deletes when appropriate

Avoid duplicated information.

Optimize relationships.

Prevent N+1 queries.

---

# FILE STORAGE

Separate uploaded assets from application code.

Validate:

file type

size

dimensions

virus scan when applicable

Generate optimized versions for images.

Never trust filenames provided by users.

---

# PERFORMANCE ENGINEERING

Optimize continuously.

Focus on:

render performance

API latency

database efficiency

bundle size

network requests

lazy loading

pagination

image optimization

code splitting

memoization when beneficial

Avoid premature optimization.

Measure before optimizing.

---

# SECURITY STANDARDS

The application must resist common attacks.

Protect against:

SQL Injection

XSS

CSRF

Clickjacking

Open Redirects

Path Traversal

Mass Assignment

Broken Authentication

Privilege Escalation

Rate Abuse

Validate every input.

Sanitize every output.

Escape rendered content.

Store secrets outside the repository.

---

# ACCESSIBILITY (WCAG)

Accessibility is mandatory.

Every interface must support:

keyboard navigation

screen readers

focus visibility

ARIA labels where needed

semantic HTML

proper contrast ratios

logical tab order

visible validation feedback

Accessibility must never be considered optional.

---

# RESPONSIVE DESIGN

Every interface must work flawlessly on:

Desktop

Laptop

Tablet

Mobile

Ultra-wide screens

Never design desktop-first only.

Test realistic breakpoints.

---

# LOGGING

Log meaningful events.

Examples:

authentication

payments

critical actions

errors

security events

administration actions

Logs should be structured.

Never log passwords or secrets.

---

# OBSERVABILITY

Prepare the application for production monitoring.

Support:

health checks

error monitoring

performance metrics

request tracing

audit logs

uptime monitoring

---

# TESTING STRATEGY

Every important feature should be testable.

Testing pyramid:

Unit Tests

↓

Integration Tests

↓

End-to-End Tests

Test:

authentication

payments

forms

permissions

critical workflows

API endpoints

Never ship critical flows untested.

---

# REFACTORING POLICY

Whenever touching existing code:

Leave it cleaner than before.

Reduce complexity.

Remove dead code.

Improve naming.

Extract reusable logic.

Improve documentation.

Never introduce additional technical debt.

---

# DOCUMENTATION

Every important module should be documented.

Document:

purpose

inputs

outputs

dependencies

limitations

API contracts

Avoid useless comments.

Code should explain itself whenever possible.

---

# GIT STANDARDS

Commits must be:

atomic

descriptive

focused

Use Conventional Commits.

Examples:

feat:

fix:

refactor:

perf:

docs:

test:

build:

Never mix unrelated changes.

---

# DEPENDENCY MANAGEMENT

Avoid unnecessary packages.

Before installing a dependency ask:

Can this be implemented internally?

Does it increase bundle size?

Is it actively maintained?

Is it secure?

Prefer mature libraries.

---

# CODE REVIEW MINDSET

Before considering a task complete, perform an internal review.

Verify:

readability

performance

security

maintainability

accessibility

consistency

typing

error handling

Only deliver code you would confidently approve during a senior engineering code review.

---

# IMPLEMENTATION PHILOSOPHY

Never implement the minimum.

Implement the correct solution.

Every change should leave the project in a better state than before.

The objective is not merely to complete tasks.

The objective is to build software that deserves to run in production.
---

# ROUTING SECURITY STANDARD

Any user-provided redirect destination must be normalized through a shared routing utility before navigation. Only same-origin relative paths are allowed; protocol-relative URLs, absolute external URLs, and backslash-containing values must fall back to a safe internal route.
