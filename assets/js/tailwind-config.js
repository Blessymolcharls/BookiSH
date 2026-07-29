tailwind.config = {
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        card: 'var(--bg-card)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)'
      },
      backgroundColor: {
        page: 'var(--bg-page)',
        card: 'var(--bg-card)'
      },
      textColor: {
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)'
      },
      borderColor: {
        card: 'var(--bg-card)',
        subtle: 'var(--border-subtle)'
      }
    }
  }
}
