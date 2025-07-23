@echo off
REM Build Tailwind CSS using the CLI and output to src/tailwind-cli.output.css
npx tailwindcss -i ./src/tailwind-cli.css -c ./tailwind.config.js -o ./src/tailwind-cli.output.css --watch
