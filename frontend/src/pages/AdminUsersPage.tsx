import PersonAddSharp from '@mui/icons-material/PersonAddSharp';
import SearchSharp from '@mui/icons-material/SearchSharp';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';
import OutlinedInput from '@mui/material/OutlinedInput';
import Skeleton from '@mui/material/Skeleton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { CreateUserDialog } from '@/components/admin/CreateUserDialog';
import { PageHeader } from '@/components/PageHeader';
import { roleLabels } from '@/domain/roles';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { adminUsersApi } from '@/lib/api';
import { ApiError } from '@/lib/api/api-error';
import { queryKeys } from '@/lib/query-keys';
import { paths } from '@/router/paths';
import { colors } from '@/theme/tokens';

const COLUMNS = ['Nome', 'E-mail', 'Perfil', 'Matrícula', 'Situação'] as const;

export default function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [creating, setCreating] = useState(false);
  const busca = useDebouncedValue(search.trim());

  const params = { page: page + 1, per_page: perPage, ...(busca ? { busca } : {}) };
  const query = useQuery({
    queryKey: queryKeys.adminUserList(params),
    queryFn: () => adminUsersApi.list(params),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Usuários"
        description="Contas com acesso ao EduSpace."
        breadcrumbs={[{ label: 'Administração', to: paths.admin }, { label: 'Usuários' }]}
        actions={
          <Button
            variant="contained"
            startIcon={<PersonAddSharp />}
            onClick={() => setCreating(true)}
          >
            Nova conta
          </Button>
        }
      />

      <Box sx={{ maxWidth: 420, mb: 2 }}>
        <OutlinedInput
          fullWidth
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(0);
          }}
          placeholder="Nome, e-mail ou matrícula"
          slotProps={{ input: { 'aria-label': 'Buscar usuários' } }}
          startAdornment={
            <InputAdornment position="start">
              <SearchSharp aria-hidden />
            </InputAdornment>
          }
        />
      </Box>

      {query.isError ? (
        <Box role="alert" sx={{ border: 1, borderColor: 'divider', p: 3 }}>
          <Typography>{ApiError.from(query.error).message}</Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={() => void query.refetch()}>
            Tentar de novo
          </Button>
        </Box>
      ) : (
        <Box sx={{ border: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table aria-label="Usuários" aria-busy={query.isPending}>
              <TableHead sx={{ backgroundColor: colors.sunken }}>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableCell key={column} sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {column}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {query.isPending &&
                  Array.from({ length: 5 }, (_, row) => (
                    <TableRow key={row}>
                      {COLUMNS.map((column) => (
                        <TableCell key={column}>
                          <Skeleton variant="rectangular" height={16} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                {query.data?.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.nome}</TableCell>
                    <TableCell sx={{ overflowWrap: 'anywhere' }}>{user.email}</TableCell>
                    <TableCell>{roleLabels[user.perfil]}</TableCell>
                    <TableCell>
                      {user.matricula ? (
                        <Typography variant="data">{user.matricula}</Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Não informada
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{user.ativo ? 'Ativa' : 'Desativada'}</TableCell>
                  </TableRow>
                ))}
                {query.data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={COLUMNS.length}>
                      {busca
                        ? `Nenhuma conta encontrada para "${busca}".`
                        : 'Nenhuma conta cadastrada ainda.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
          <TablePagination
            component="div"
            count={query.data?.total ?? 0}
            page={page}
            onPageChange={(_event, next) => setPage(next)}
            rowsPerPage={perPage}
            onRowsPerPageChange={(event) => {
              setPerPage(Number(event.target.value));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="Por página"
            labelDisplayedRows={({ from, to, count }) => `${from} a ${to} de ${count}`}
            getItemAriaLabel={(type) =>
              type === 'next' ? 'Próxima página' : type === 'previous' ? 'Página anterior' : type
            }
          />
        </Box>
      )}

      <CreateUserDialog open={creating} onClose={() => setCreating(false)} />
    </>
  );
}
