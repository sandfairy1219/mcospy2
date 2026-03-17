# mcospy

milkchoco frida cheat tool

## Development

### Prerequisites

- Node.js 20+
- npm
- Windows (for building)

### Setup

```bash
npm install
npm run build
npm start
```

### Building for Production

```bash
npm run dist
```

## GitHub Actions - Automatic Releases

This project uses GitHub Actions to automatically build and release when tags are pushed.

### How to Create a Release

1. **Commit your changes** to the main branch
2. **Create a version tag** in the format `v2.n.n` (e.g., `v2.1.0`)
   ```bash
   git tag v2.1.0
   git push origin main --tags
   ```
3. **Wait for the workflow** to complete:
   - The workflow will automatically run `npm run dist`
   - It will create `pixel-Setup-2.1.0.exe` (note the dashes instead of spaces)
   - It will upload the installer, `latest.yml`, and blockmap to the GitHub release

### Workflow Details

- **Trigger**: Push tags matching `v[0-9]+.[0-9]+.[0-9]+`
- **Build Platform**: Windows
- **Output**: `pixel-Setup-{version}.exe` (with dashes, not spaces)
- **Auto-publish**: Files are automatically uploaded to GitHub Releases

### Files Generated

- `pixel-Setup-2.1.0.exe` - The installer
- `latest.yml` - Update metadata for electron-updater
- `pixel-Setup-2.1.0.exe.blockmap` - Blockmap for differential updates

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.
