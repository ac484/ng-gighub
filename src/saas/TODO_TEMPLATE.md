# DESIGN / README TODO Template

This template is used to populate `DESIGN.md` and `README.md` files so automated tools (AI) can generate precise code.

DESIGN.md checklist

- Purpose: One-line module responsibility.
- Public API: For each exported function/method include:
  - Name: `fnName`
  - Signature: `async function fnName(input: InputType): Promise<Result<OutputType>>`
  - Input example (JSON)
  - Success output example (JSON)
  - Error output examples (list error.code and example JSON)
- Data Models: TypeScript interfaces with each field and type (required/optional).
- Persistence: Repository name and Firestore paths used.
- Security: Required roles/permissions and server-side checks.
- Acceptance Criteria: One or more test cases (Arrange/Act/Assert) per public method.
- Implementation TODOs: concrete tasks (e.g., "Add TenantRepository.findById returning Result<Tenant>").

README.md checklist

- Overview: short paragraph.
- Quickstart: minimal code snippet that imports and calls the facade.
- File layout: list of main files and their roles.
- Conventions: mention `inject()`, signals, Result pattern, no secrets in frontend.
- Example usage: code snippet and expected result.

Guidance for AI code generators

- Always prefer typed interfaces (no `any`).
- Provide example JSON for both inputs and outputs.
- Enumerate error codes and messages.
- Clearly label backend-only operations.

Use this template as a source of truth and then copy/adapt into each subfolder's `DESIGN.md`/`README.md`.
