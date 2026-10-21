# Fotos de perfil — Cloudflare R2

As imagens ficam no R2; PostgreSQL/Neon armazena apenas `User.avatarUrl` (já existente) e `User.avatarKey` (nova referência interna nullable). Usuários existentes permanecem compatíveis, sem conversão de dados. A migration `20261021000000_add_user_avatar_key` adiciona somente uma coluna nullable e deve ser revisada antes de aplicação em produção.

## Configuração posterior

Configurar somente no ambiente do backend, sem versionar valores:

```dotenv
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BASE_URL=
```

O usuário ainda precisa criar/configurar sua conta e bucket R2, habilitar leitura pública por domínio HTTPS e criar credenciais S3 restritas ao bucket com leitura/escrita/exclusão de objetos. `R2_PUBLIC_BASE_URL` deve apontar para a raiz pública do bucket (ou prefixo público correspondente), sem query string ou fragmento; manter esse endereço estável para URLs já persistidas. O endpoint S3 é derivado do account ID, com região `auto`, conforme a [documentação oficial do R2](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/).

`compose.yaml` já carrega `backend/.env` via `env_file`; nenhuma alteração no compose ou configuração pública do frontend é necessária. Não colocar credenciais em variáveis `NEXT_PUBLIC_*`. A interface usa `<img>` com URL pública, dimensões fixas e recorte `object-cover`, sem proxy `next/image` e sem liberar domínios wildcard. Se houver CSP externa, liberar o domínio público em `img-src` (e `blob:` para preview).

Sem configuração R2 o backend inicia normalmente. Upload retorna HTTP 503 com erro controlado. Nenhum cliente R2, consulta extra, timer ou tarefa de avatar é iniciado em background.

## API e comportamento

- `PUT /api/v1/users/me/avatar`: JWT obrigatório; multipart com um campo `file`, sem `userId`. Aceita JPEG, PNG ou WebP não vazios, até 5 MiB (5.242.880 bytes); valida MIME e assinatura básica do formato. Não decodifica/reprocessa a imagem nem remove metadados EXIF. O arquivo se torna público; evite fotos com conteúdo ou metadados sensíveis.
- `DELETE /api/v1/users/me/avatar`: JWT obrigatório; remove a referência e retorna `{ "avatarUrl": null }`; é idempotente quando já está sem foto.
- Respostas expõem somente `avatarUrl`. `avatarKey` nunca entra nos DTOs públicos. Não há gestão administrativa.
- Chaves `avatars/{id-do-usuário}/{uuid}.{extensão}` são geradas pelo servidor, sem usar o nome original. URLs novas evitam cache antigo. A substituição envia a imagem antes de persistir e só então limpa o objeto anterior. Atualização condicional evita sobrescrever uma alteração concorrente (409). Se o banco rejeitar a atualização, tenta limpar o upload recém-criado.
- Limpeza é restrita ao prefixo do próprio usuário e ocorre na mesma ação explícita. Falhas são registradas sem credenciais e não desfazem estado válido. Podem restar objetos órfãos após falha de limpeza ou interrupção do processo; não há reconciliação, scheduler ou retry em background. URLs legadas sem chave são desassociadas sem tentativa de excluir objetos desconhecidos.
- Perfil, header autenticado, classificação geral e Rodadas exibem foto ou iniciais, inclusive quando a imagem falha. No mobile de Rodadas o avatar tem 24 px e preserva a lista compacta.

## Antes do deploy no TrueNAS

1. Revisar código e migration, garantir backup e configurar R2/publicação HTTPS e as cinco variáveis acima.
2. Validar configuração e permissões em ambiente apropriado, incluindo upload/substituição/remoção com conta de teste e leitura pública das imagens.
3. Em uma janela de deploy autorizada separadamente, aplicar a migration com o procedimento usual e publicar backend/frontend juntos.

Esta implementação não executa migration em produção, não configura Cloudflare e não faz deploy. Testes automatizados usam exclusivamente storage/banco falsos e SDK mockado; QA usa interceptação de API no runtime externo, sem credenciais reais.

Para repetir o QA, iniciar o frontend local em `http://127.0.0.1:3101` e executar `npm run test:avatar` em `frontend`. O script usa Playwright instalado em `%LOCALAPPDATA%\MatchPredict-Browser-QA`, intercepta todas as APIs e impede acesso externo fora dos mocks. `MATCHPREDICT_QA_RUNTIME` e `MATCHPREDICT_QA_URL` permitem ajustar runtime e URL local. Screenshots são gravadas somente na pasta externa `artifacts`.
