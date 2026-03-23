# Contributing to Emergency Route System

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## 🎯 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Report issues professionally

## 📋 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Emergency-Route-System.git
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes**
5. **Test thoroughly**
6. **Commit with clear messages**
7. **Push and create a Pull Request**

## 🏗️ Development Setup

```bash
make setup
make clean-all
```

## 📝 Commit Messages

Follow this format:
```
[TYPE] Brief description

More detailed explanation if needed.

- Bullet points for changes
- Keep it concise
```

**Types:**
- `[FEAT]` - New feature
- `[FIX]` - Bug fix
- `[DOCS]` - Documentation
- `[STYLE]` - Code style
- `[REFACTOR]` - Code refactoring
- `[PERF]` - Performance improvement
- `[TEST]` - Tests
- `[CHORE]` - Build/tooling

## 🧪 Testing

### Before submitting a PR, ensure:

1. **Backend tests pass**
   ```bash
   cd backend && npm test  # If tests exist
   ```

2. **API endpoints respond**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Frontend works**
   - Open http://localhost:8000
   - Test route finding
   - Verify traffic updates

4. **C++ compiles without errors**
   ```bash
   make clean && make build
   ```

## 🐛 Bug Reports

Create an issue with:
- **Title:** Clear, specific description
- **Steps to reproduce:** Exact steps
- **Expected behavior:** What should happen
- **Actual behavior:** What actually happens
- **Environment:** OS, versions, etc.
- **Screenshots:** If applicable

Example:
```
Title: Route calculation fails for airport node

Steps:
1. Start application
2. Enter "CentralHospital" as start
3. Enter "Airport" as destination
4. Click "Find Route"

Expected: Route displayed
Actual: Error message shown
Error: "Node not found"
```

## 💡 Feature Requests

Describe:
- **Use case:** Why is this needed?
- **Solution:** How should it work?
- **Alternatives:** Other approaches?
- **Example:** Usage scenario

## 🚀 Pull Request Guidelines

### Before submitting:
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] No console errors or warnings
- [ ] Tested on multiple scenarios
- [ ] Commit history is clean
- [ ] PR description is clear

### PR Description Template:
```markdown
## Description
Brief explanation of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation

## Related Issues
Fixes #123

## Testing
- [ ] Unit tests added
- [ ] Manual testing done
- [ ] No breaking changes

## Checklist
- [ ] Code follows style guide
- [ ] Self-review completed
- [ ] Documentation updated
```

## 📂 Project Structure Standards

### C++ Code
```cpp
// Use descriptive names
int nodeCount;  // Good
int nc;         // Bad

// Comments for logic
// Calculate shortest path using Dijkstra algorithm
vector<int> path = dijkstra.findShortestPath(start, end);

// Use const correctness
const Node& getNode(int id) const;

// Proper error handling
if (!file.is_open()) {
    throw runtime_error("Cannot open file");
}
```

### JavaScript Code
```javascript
// Use async/await
async function findRoute() {
    try {
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error:', error);
    }
}

// Meaningful variable names
const emergencyServiceHospitals = [];  // Good
const esp = [];                        // Bad

// Use modern syntax
const { start, end } = req.body;
```

### CSS Code
```css
/* Use BEM notation for classes */
.button { }
.button--primary { }
.button__text { }

/* Organize with comments */
/* Typography */
body { }
h1 { }

/* Layout */
.container { }
.grid { }

/* Components */
.card { }
```

## 📚 Documentation

When adding features, update:
1. **README.md** - Overview and usage
2. **ARCHITECTURE.md** - Design details
3. **Code comments** - Complex logic
4. **API docs** - Endpoint descriptions
5. **CHANGELOG** - Version history

## 🎓 Learning Resources

- [Dijkstra's Algorithm](https://www.geeksforgeeks.org/dijkstras-algorithm/)
- [Express.js Guide](https://expressjs.com/guide)
- [C++ Best Practices](https://isocpp.org/)
- [REST API Design](https://restfulapi.net/)

## 🤝 Getting Help

- **Issues**: Create an issue for discussions
- **Discussions**: Use GitHub Discussions
- **Email**: Contact maintainers

## ✅ Approval Process

1. Automated checks pass
2. Code review by maintainers
3. Constructive feedback addressed
4. Merge when approved

## 📦 Release Process

Version format: `v[MAJOR].[MINOR].[PATCH]`

- `v1.0.0` - Initial release
- `v1.1.0` - New features
- `v1.1.1` - Bug fixes

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Acknowledged in documentation

## Questions?

Feel free to:
- Open an issue for discussion
- Ask in code reviews
- Contact maintainers directly

---

**Thank you for contributing! Your efforts improve the project for everyone.** 🚑
