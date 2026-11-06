export default [
    {ignores: ['dist/**', 'demo/**', 'node_modules/**', 'examples/**']},
    {
        files: ['**/*.js', '**/*.cjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            globals: {
                URL: 'readonly',
                console: 'readonly',
                document: 'readonly',
                window: 'readonly',
                require: 'readonly',
                process: 'readonly',
                viewer: 'writable',
                clicks: 'writable',
                Satsuma: 'readonly',
            },
        },
        rules: {
            'no-unused-vars': ['error', {argsIgnorePattern: '^_'}],
            'no-undef': 'error',
            'no-unreachable': 'error',
            'no-constant-condition': 'error',
            'valid-typeof': 'error',
        },
    },
];
