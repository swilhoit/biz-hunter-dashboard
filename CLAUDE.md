# Claude Development Guidelines

## Important Rules

### Data Integrity
- **NEVER use fake data as a workaround** - Always work with real data from the database or proper API sources
- When debugging issues, trace the actual data flow rather than substituting mock data
- If data is missing or incomplete, address the root cause rather than masking it with fake data
- Maintain data authenticity throughout the development process

### Development Practices
- Always read files before editing them
- Follow existing code patterns and conventions
- Use TypeScript types where appropriate
- Test functionality thoroughly before marking tasks complete

### Project Context
This is a business acquisition dashboard that helps users track and analyze Amazon FBA businesses for potential purchase. Data accuracy and authenticity are critical for making informed investment decisions.