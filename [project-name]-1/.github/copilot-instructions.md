# Copilot Instructions for [Project Name]

## Big Picture Architecture
- The application follows a modular architecture, separating concerns into controllers, services, and types.
- **Controllers** (src/controllers/index.ts) handle HTTP requests and responses, delegating business logic to services.
- **Services** (src/services/index.ts) contain the core business logic and interact with external systems or databases.
- **Types** (src/types/index.ts) define the data structures used across the application, ensuring type safety.

## Developer Workflows
- **Building the Project**: Use `npm run build` to compile TypeScript files into JavaScript.
- **Running the Application**: Start the server with `npm start`. Ensure the build step is completed first.
- **Testing**: Run tests using `npm test`. Ensure that all tests are passing before committing changes.

## Project-Specific Conventions
- Controllers should be kept thin; all business logic should reside in services.
- Use descriptive names for functions and variables to enhance code readability.
- Follow the established directory structure to maintain organization and clarity.

## Integration Points
- The application may interact with external APIs or databases through service functions. Ensure that any external dependencies are documented in the README.md.
- Communication between components is primarily through function calls, with controllers invoking services directly.

## Example Patterns
- In `src/controllers/index.ts`, you might find a function like `getUser` that calls a corresponding service method to fetch user data.
- In `src/services/index.ts`, a function like `fetchUserData` would handle the logic for retrieving user information from an external API.

Please review this updated `.github/copilot-instructions.md` and let me know if there are any unclear or incomplete sections that need further iteration.