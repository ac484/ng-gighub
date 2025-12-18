---
description: 'Standards for creating documentation, markdown files, instructions, and prompts'
applyTo: '**/*.md, **/*.instructions.md, **/*.prompt.md'
---

# Documentation Standards

Guidelines for creating high-quality documentation, custom instructions, markdown content, and prompt files for GitHub Copilot.

## Table of Contents

1. [Custom Instruction Files](#custom-instruction-files)
2. [Markdown Content Standards](#markdown-content-standards)
3. [Prompt File Guidelines](#prompt-file-guidelines)

---

## Custom Instruction Files

Instructions for creating effective and maintainable custom instruction files that guide GitHub Copilot.

### Required Frontmatter

Every instruction file must include YAML frontmatter:

```yaml
---
description: 'Brief description of the instruction purpose and scope (1-500 characters)'
applyTo: 'glob pattern for target files (e.g., **/*.ts, **/*.py)'
---
```

#### Frontmatter Guidelines

- **description**: Single-quoted string, clearly stating the purpose
- **applyTo**: Glob pattern(s) specifying target files
  - Single: `'**/*.ts'`
  - Multiple: `'**/*.ts, **/*.tsx, **/*.js'`
  - Specific: `'src/**/*.py'`
  - All files: `'**'`

### File Structure

#### 1. Title and Overview
- Clear, descriptive title using `#` heading
- Brief introduction explaining purpose and scope
- Optional: Project context with key technologies and versions

#### 2. Core Sections

Organize content logically:
- **General Instructions**: High-level guidelines
- **Best Practices**: Recommended patterns
- **Code Standards**: Naming, formatting, style
- **Architecture/Structure**: Organization and design
- **Common Patterns**: Frequently used implementations
- **Security**: Security considerations (if applicable)
- **Performance**: Optimization guidelines (if applicable)
- **Testing**: Testing standards (if applicable)

#### 3. Examples and Code Snippets

Provide concrete examples with clear labels:

```markdown
### Good Example
\`\`\`typescript
// Recommended approach
const user = inject(UserService);
\`\`\`

### Bad Example
\`\`\`typescript
// Avoid this pattern
constructor(private user: UserService) {}
\`\`\`
```

#### 4. Validation and Verification

- Build commands to verify code
- Linting and formatting tools
- Testing requirements
- Verification steps

### Writing Style

- Use clear, concise language
- Write in imperative mood ("Use", "Implement", "Avoid")
- Be specific and actionable
- Avoid ambiguous terms like "should", "might", "possibly"
- Use bullet points and lists for readability
- Keep sections focused and scannable

### Best Practices

- **Be Specific**: Provide concrete examples over abstract concepts
- **Show Why**: Explain reasoning when it adds value
- **Use Tables**: For comparisons, rules, or patterns
- **Include Examples**: Real code snippets over descriptions
- **Stay Current**: Reference current versions and best practices
- **Link Resources**: Include official documentation and authoritative sources

### Common Patterns to Include

1. **Naming Conventions**: Variables, functions, classes, files
2. **Code Organization**: File structure, modules, imports
3. **Error Handling**: Preferred patterns
4. **Dependencies**: Management and documentation
5. **Comments/Documentation**: When and how to document
6. **Version Information**: Target language/framework versions

### Patterns to Avoid

- Overly verbose explanations
- Outdated information
- Ambiguous guidelines
- Missing examples
- Contradictory advice
- Copy-paste from documentation without context

### Testing Instructions

Before finalizing:
1. **Test with Copilot**: Try with actual prompts
2. **Verify Examples**: Ensure code examples work
3. **Check Glob Patterns**: Confirm `applyTo` patterns match intended files

---

## Markdown Content Standards

Rules and guidelines for markdown content creation.

### Content Rules

1. **Headings**: Use H2, H3, etc. to structure content. Do not use H1 (generated from title).
2. **Lists**: Use bullet points or numbered lists with proper indentation.
3. **Code Blocks**: Use fenced code blocks with language specification.
4. **Links**: Use proper markdown syntax with descriptive text.
5. **Images**: Use proper syntax with alt text for accessibility.
6. **Tables**: Use markdown tables with proper formatting and alignment.
7. **Line Length**: Limit to 400 characters for readability.
8. **Whitespace**: Use appropriate whitespace to separate sections.

### Formatting Guidelines

- **Headings**: Use `##` for H2 and `###` for H3 hierarchically. Avoid H4+ when possible.
- **Lists**: Use `-` for bullets, `1.` for numbers. Indent nested lists with two spaces.
- **Code Blocks**: Use triple backticks with language: ` ```typescript `
- **Links**: `[descriptive text](URL)` with valid, accessible URLs
- **Images**: `![alt text](image URL)` with brief description
- **Tables**: Use `|` for columns with proper alignment and headers
- **Line Length**: Break lines at 80 characters when possible
- **Whitespace**: Use blank lines to separate sections, avoid excessive whitespace

### Validation Requirements

For blog posts and articles, include these frontmatter fields:

```yaml
---
post_title: 'The title'
author1: 'Author name'
post_slug: 'url-slug'
microsoft_alias: 'alias'
featured_image: 'image-url'
categories: ['category1', 'category2']
tags: ['tag1', 'tag2']
ai_note: 'AI usage note'
summary: 'Brief summary'
post_date: '2025-12-18'
---
```

- **Categories**: Must be from approved list
- **Summary**: Brief overview of content
- **Validation**: Run validation tools to check compliance

---

## Prompt File Guidelines

Instructions for creating effective prompt files for GitHub Copilot Chat.

### Frontmatter Requirements

Every prompt file must include:

```yaml
---
description: 'Brief description of the prompt purpose and outcome (single sentence, actionable)'
mode: 'ask | edit | agent'
tools: 'minimal set of tool bundles required'
---
```

#### Frontmatter Fields

- **description**: Single-quoted string, actionable outcome
- **mode**: Explicitly choose `ask`, `edit`, or `agent`
- **tools**: Minimal tool bundles needed (in preferred execution order)
- **model**: Optional, specify if depends on specific capability tier

### File Naming and Placement

- Use kebab-case: `generate-readme.prompt.md`
- Store in `.github/prompts/` unless workspace specifies otherwise
- Short filename that communicates action

### Body Structure

#### 1. Title and Overview
- `#` level heading matching prompt intent (for Quick Pick search)
- Brief introduction explaining purpose and scope

#### 2. Recommended Sections

Organize with predictable structure:
- **Mission/Primary Directive**: Why this prompt exists
- **Scope & Preconditions**: Context and requirements
- **Inputs**: Required variables and context
- **Workflow**: Step-by-step execution
- **Output Expectations**: Format and structure
- **Quality Assurance**: Validation steps

Adjust section names to fit domain, but maintain logical flow: why → context → inputs → actions → outputs → validation

#### 3. Input and Context Handling

- Use `${input:variableName[:placeholder]}` for required values
- Provide defaults or alternatives where possible
- Call out contextual variables: `${selection}`, `${file}`, `${workspaceFolder}`
- Document how to proceed when mandatory context is missing

#### 4. Tool and Permission Guidance

- Limit `tools` to smallest set that enables the task
- List in preferred execution order when sequence matters
- Warn about destructive operations (file creation, edits, terminal commands)
- Include guard rails or confirmation steps

### Instruction Tone and Style

- Write in direct, imperative sentences targeted at Copilot ("Analyze", "Generate", "Summarize")
- Keep sentences short and unambiguous
- Avoid idioms, humor, or culturally specific references
- Favor neutral, inclusive language

### Output Definition

- Specify format, structure, and location of results
- Include success criteria and failure triggers
- Provide validation steps (manual checks, automated commands, acceptance criteria)

### Examples and Reusable Assets

- Embed Good/Bad examples or scaffolds (Markdown templates, JSON stubs)
- Maintain reference tables inline (capabilities, status codes, role descriptions)
- Link to authoritative documentation instead of duplicating lengthy guidance

### Quality Assurance Checklist

- [ ] Frontmatter complete, accurate, and least-privilege
- [ ] Inputs include placeholders, defaults, and fallbacks
- [ ] Workflow covers preparation, execution, and post-processing
- [ ] Output expectations include formatting and storage details
- [ ] Validation steps are actionable (commands, diff checks, review prompts)
- [ ] Security, compliance, and privacy policies referenced are current
- [ ] Prompt executes successfully in VS Code with representative scenarios

### Maintenance Guidance

- Version-control prompts alongside affected code
- Update when dependencies, tooling, or review processes change
- Review periodically to ensure tool lists, model requirements, and links remain valid
- Coordinate with other repositories for broadly useful prompts

---

## General Best Practices

### Consistency
- Follow established patterns in existing documentation
- Use consistent terminology across all files
- Maintain uniform formatting and structure

### Clarity
- Write for the intended audience (developers, AI, both)
- Provide context when needed
- Use examples to illustrate complex concepts

### Maintainability
- Keep content modular and focused
- Update documentation when code changes
- Remove outdated information promptly

### Accessibility
- Use descriptive link text
- Provide alt text for images
- Ensure proper heading hierarchy
- Use semantic HTML in markdown when needed

---

## References

- [Custom Instructions Documentation](https://code.visualstudio.com/docs/copilot/customization/custom-instructions)
- [Prompt Files Documentation](https://code.visualstudio.com/docs/copilot/customization/prompt-files)
- [Markdown Guide](https://www.markdownguide.org/)
- [Awesome Copilot Instructions](https://github.com/github/awesome-copilot/tree/main/instructions)
- [Awesome Copilot Prompt Files](https://github.com/github/awesome-copilot/tree/main/prompts)

---

**Version**: v1.0  
**Last Updated**: 2025-12-18  
**Purpose**: Consolidated documentation standards for token efficiency
