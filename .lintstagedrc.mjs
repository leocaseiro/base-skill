const skip = (files) =>
  files.filter((f) => !f.includes('/.specstory/'));

const cmd = (command, files) => {
  const filtered = skip(files);
  return filtered.length > 0
    ? [`${command} ${filtered.join(' ')}`]
    : [];
};

export default {
  '*.{ts,tsx}': (files) => [
    ...cmd('eslint --fix', files),
    ...cmd('prettier --write', files),
  ],
  '*.css': (files) => [
    ...cmd('stylelint --fix', files),
    ...cmd('prettier --write', files),
  ],
  '*.md': (files) => [
    ...cmd('markdownlint-cli2 --fix', files),
    ...cmd('prettier --write', files),
  ],
  '*.json': (files) => cmd('prettier --write', files),
};
