import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { Link as RouterLink } from 'react-router';

import { paths } from '@/router/paths';
import { touchTarget } from '@/theme/patterns';
import { colors, fonts } from '@/theme/tokens';

export function BrandMark() {
  return (
    <Link
      component={RouterLink}
      to={paths.home}
      underline="none"
      sx={{ ...touchTarget, gap: 1.25, color: 'text.primary' }}
    >
      <Box
        aria-hidden
        sx={{
          width: 28,
          height: 28,
          display: 'grid',
          placeItems: 'center',
          backgroundColor: colors.ink,
          color: colors.brandAccent,
          fontFamily: fonts.display,
          fontWeight: 500,
        }}
      >
        E
      </Box>
      <Box component="span" sx={{ fontWeight: 700 }}>
        EduSpace
      </Box>
    </Link>
  );
}
