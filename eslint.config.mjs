import nextConfig from 'eslint-config-next';

const eslintConfig = [
  ...nextConfig,
  {
    rules: {
      '@next/next/no-img-element': 'error',
      'no-restricted-imports': [
        'error',
        {
          name: 'next/link',
          message:
            'Please import `Link` from `@/lib/i18n` or `@/i18n/navigation` instead of `next/link`.',
        },
      ],
    },
  },
  {
    // Restrict fs imports to src/lib/content/ only (Invariant 1)
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['src/lib/content/**', 'scripts/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'next/link',
              message:
                'Please import `Link` from `@/lib/i18n` or `@/i18n/navigation` instead of `next/link`.',
            },
            {
              name: 'fs',
              message:
                '`fs` can only be imported within `src/lib/content` (Invariant 1).',
            },
            {
              name: 'node:fs',
              message:
                '`node:fs` can only be imported within `src/lib/content` (Invariant 1).',
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
