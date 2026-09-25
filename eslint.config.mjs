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
            'Please import `Link` from `@/lib/site-routes` instead of `next/link`.',
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
                'Please import `Link` from `@/lib/site-routes` instead of `next/link`.',
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
  {
    /**
     * Yönetim paneli bilinçli olarak site dilinden bağımsızdır: `/manage`
     * altındaki adresler public site yollarından ayrıdır. `fs` yasağı panelde
     * aynen geçerli kalır.
     */
    files: ['src/app/manage/**/*.{ts,tsx}', 'src/components/admin/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
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
