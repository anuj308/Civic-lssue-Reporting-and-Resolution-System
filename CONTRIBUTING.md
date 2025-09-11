# Contributing to Civic Issue Reporting System

Thank you for your interest in contributing to the Civic Issue Reporting and Resolution System! This document provides guidelines for contributing to this project.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive feedback
- Be patient with questions and different skill levels
- Respect different viewpoints and experiences

## How to Contribute

### Reporting Issues

Before creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use a clear, descriptive title** for the issue
3. **Provide detailed information** including:
   - Steps to reproduce the problem
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, browser, etc.)

### Suggesting Features

We welcome feature suggestions! Please:

1. **Check if the feature already exists** or is planned
2. **Describe the feature clearly** and explain why it would be valuable
3. **Consider the scope** - is this a minor enhancement or major feature?
4. **Provide examples** of how the feature would work

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/Civic-lssue-Reporting-and-Resolution-System.git
   cd Civic-lssue-Reporting-and-Resolution-System
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   cp .env.example .env
   # Configure your environment variables
   
   # Frontend
   cd ../frontend
   npm install
   
   # Mobile
   cd ../mobile
   npm install
   ```

3. **Start development servers**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm start
   
   # Mobile (Terminal 3)
   cd mobile
   npx expo start
   ```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write clean, documented code**
   - Follow the existing code style
   - Add comments for complex logic
   - Include JSDoc comments for functions
   - Update TypeScript types as needed

3. **Write tests**
   - Add unit tests for new functions
   - Add integration tests for new endpoints
   - Ensure all tests pass
   ```bash
   npm test
   ```

4. **Follow commit conventions**
   ```bash
   git commit -m "feat: add user notification preferences"
   git commit -m "fix: resolve issue with image upload validation"
   git commit -m "docs: update API documentation for new endpoint"
   ```

### Commit Message Format

We use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
   ```bash
   npm test
   npm run lint
   ```
4. **Create a detailed PR description**:
   - What changes were made?
   - Why were these changes necessary?
   - How were the changes tested?
   - Any breaking changes?

5. **Link related issues** using keywords:
   ```
   Closes #123
   Fixes #456
   ```

### Code Style Guidelines

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Prefer const over let, avoid var
- Use async/await over Promise chains

#### React Components
- Use functional components with hooks
- Follow component naming conventions (PascalCase)
- Use proper prop types
- Keep components small and focused

#### API Development
- Follow RESTful conventions
- Use proper HTTP status codes
- Include comprehensive error handling
- Document all endpoints
- Validate all inputs

#### Database
- Use proper indexing for queries
- Follow naming conventions
- Add data validation
- Consider performance implications

### Testing Guidelines

#### Backend Tests
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
```

#### Frontend Tests
```bash
cd frontend
npm test                # Run all tests
npm test -- --coverage # Generate coverage report
```

#### Test Coverage
- Aim for 80%+ test coverage
- Focus on testing business logic
- Include edge cases and error scenarios
- Test API endpoints thoroughly

### Documentation

- Update README files for significant changes
- Add inline code comments for complex logic
- Update API documentation for new endpoints
- Include examples in documentation

### Performance Considerations

- **Backend**: 
  - Use database indexes appropriately
  - Implement caching where beneficial
  - Optimize API response times
  - Handle rate limiting properly

- **Frontend**:
  - Optimize bundle size
  - Use lazy loading for routes
  - Implement proper error boundaries
  - Optimize images and assets

- **Mobile**:
  - Optimize for different screen sizes
  - Handle offline scenarios
  - Minimize app size
  - Test on different devices

### Security Guidelines

- **Never commit sensitive data** (API keys, passwords, etc.)
- **Validate all user inputs** on both client and server
- **Use HTTPS** for all communications
- **Implement proper authentication** and authorization
- **Follow OWASP security guidelines**
- **Regular security audits** using npm audit

### Accessibility

- **Follow WCAG 2.1 guidelines**
- **Use semantic HTML elements**
- **Include proper ARIA labels**
- **Ensure keyboard navigation works**
- **Test with screen readers**
- **Maintain proper color contrast**

### Browser/Device Support

- **Desktop**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 13+, Android 8+
- **Screen sizes**: 320px to 1920px width
- **Accessibility**: Screen readers, keyboard navigation

### Getting Help

If you need help:

1. **Check the documentation** in the `/docs` folder
2. **Search existing issues** for similar problems
3. **Ask questions** in GitHub Discussions
4. **Join our community** Slack channel (if available)

### Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Annual contributor appreciation

## Development Workflow

1. **Issue assignment**: Comment on issues you'd like to work on
2. **Branch naming**: `feature/issue-number-brief-description`
3. **Regular commits**: Make small, focused commits
4. **Pull request review**: All PRs require review before merging
5. **Continuous integration**: All tests must pass before merging

## Release Process

1. **Version bumping**: Follow semantic versioning
2. **Changelog**: Maintain CHANGELOG.md
3. **Testing**: Comprehensive testing before release
4. **Documentation**: Update docs for new features
5. **Deployment**: Automated deployment pipeline

Thank you for contributing to improving civic engagement and government transparency!
