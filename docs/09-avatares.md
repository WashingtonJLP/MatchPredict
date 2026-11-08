# Fotos de perfil — Cloudinary

As imagens ficam no Cloudinary. PostgreSQL/Neon mantém os campos existentes `User.avatarUrl` (o `secure_url` HTTPS retornado pelo upload) e `User.avatarKey` (o `public_id` completo, sem extensão). A troca de storage não exige alteração no schema ou nova migration. As migrations anteriores de `avatar_key` e `USER_AVATAR_REMOVED` continuam necessárias em ambientes onde ainda não foram aplicadas; este trabalho não as executa.

## Configuração posterior

Configurar somente no ambiente do backend, sem versionar valores reais:

```dotenv
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Usar o Cloud name e o par de credenciais da aplicação no mesmo product environment, obtidos em Settings → API Keys. A credencial precisa permitir upload e exclusão das imagens em `matchpredict/avatars`. Nunca compartilhar o API Secret em mensagens, logs ou variáveis `NEXT_PUBLIC_*`.

O SDK oficial `cloudinary` recebe as credenciais explicitamente por operação; não há alteração da configuração global do SDK. O backend autentica o upload com `upload_stream`, enviando o buffer já validado, com `resource_type: image`, `type: upload`, `overwrite: false` e timeout de 30 segundos. Não são necessários upload preset, widget, bucket, domínio personalizado ou URL pública base. O frontend continua recebendo apenas a URL da API e exibindo-a em `<img>`.

`compose.yaml` já carrega `backend/.env` via `env_file`; nenhuma mudança no compose é necessária. Sem as três variáveis o backend inicia normalmente e o upload retorna HTTP 503 com erro controlado. Nenhuma chamada externa, timer ou tarefa de avatar é iniciado em background.

Referências: [SDK Node.js](https://cloudinary.com/documentation/node_integration), [upload de imagens](https://cloudinary.com/documentation/node_image_and_video_upload), [exclusão por public ID](https://cloudinary.com/documentation/image_upload_api_reference#destroy_by_public_id).

## Identificadores e pastas

- O servidor gera `matchpredict/avatars/{userId}/{uuid}` como `public_id` e persiste esse valor em `avatarKey`; não usa o nome original do arquivo nem chaves fornecidas pelo cliente.
- O adapter confere o `public_id` retornado e a URL HTTPS antes de aceitar o upload. O resultado deve ser uma imagem nova, não um asset já existente.
- Em Dynamic folders, `asset_folder: matchpredict/avatars/{userId}` também organiza a Media Library. Em Fixed folders, o caminho do `public_id` determina as pastas. Não duplicar esse prefixo em presets e não renomear public IDs de imagens em uso.
- A URL é o `secure_url` retornado pelo Cloudinary, incluindo a versão e extensão fornecidas pelo serviço. Ela não é montada manualmente nem usada para inferir alvos de exclusão.

Referência: [modos de pastas](https://cloudinary.com/documentation/folder_modes).

## API e comportamento

- `PUT /api/v1/users/me/avatar`: JWT obrigatório; multipart com um campo `file`, sem `userId`. Aceita JPEG, PNG ou WebP não vazios, até 5 MiB (5.242.880 bytes); preserva a validação de MIME e assinatura básica do formato. O backend não adiciona transformação, recorte ou reprocessamento local.
- `DELETE /api/v1/users/me/avatar`: JWT obrigatório; remove a referência e retorna `{ "avatarUrl": null }`; é idempotente quando já está sem foto.
- Respostas expõem somente `avatarUrl`. `avatarKey` permanece interno.
- Cada substituição cria um novo UUID, envia a imagem antes de persistir e limpa o asset anterior somente depois de atualizar a referência. A atualização condicional preserva alterações concorrentes (409). Se o banco rejeitar a atualização, tenta excluir o novo upload.
- A limpeza aceita somente IDs no prefixo do próprio usuário e no formato gerado pelo servidor. Usa `destroy` com o `public_id` armazenado, `resource_type: image`, `type: upload` e `invalidate: true`. Respostas `ok` e `not found` são tratadas como sucesso.
- A invalidação do CDN pode levar algum tempo e não revoga cópias já baixadas. Falhas de exclusão são registradas sem detalhes sensíveis e não desfazem estado válido. Podem restar assets órfãos após falhas ou interrupção do processo; não há reconciliação ou retry em background.
- Perfil, cabeçalho autenticado, classificação, Rodadas, Transparência, cabeçalho administrativo e detalhe administrativo usam o mesmo componente de foto com fallback para iniciais, inclusive quando a imagem falha.

As fotos são públicas. Se houver CSP externa, permitir o domínio de entrega utilizado pelo Cloudinary em `img-src` e `blob:` para preview. Não colocar conteúdo privado nesses uploads.

## Referências legadas do R2

A troca de adapter não transfere arquivos existentes. URLs antigas permanecem como estão até substituição ou remoção pelo fluxo normal. Chaves `avatars/{userId}/{uuid}.{extensão}` e URLs sem chave são desassociadas sem enviar exclusão ao Cloudinary. Isso evita atingir assets de outro provedor, mas não apaga o arquivo antigo no R2.

Se o R2 chegou a receber arquivos reais, inventário, transferência e limpeza do armazenamento antigo devem ser planejados separadamente antes de desativá-lo. Nenhum banco ou conta externa foi consultado por esta implementação. O Cloudflare Tunnel é independente do storage e permanece inalterado.

## Moderação administrativa

`DELETE /api/v1/admin/users/:id/avatar` exige JWT e `Role.ADMIN`, usa UUID v4 do alvo e não aceita arquivo, corpo com campos ou query parameters. Não há upload ou substituição administrativa. No detalhe do usuário, **Remover foto de perfil** aparece somente quando há URL, com confirmação, loading e bloqueio de requisições concorrentes; ao concluir, exibe as iniciais.

A operação reutiliza `UserAvatarService`. Apenas `avatarUrl` e `avatarKey` ficam `null`; os demais campos e registros do usuário são preservados. Alvo inexistente retorna 404; UUID inválido retorna 400. Sem foto, retorna 200 sem tocar no storage. Alteração concorrente retorna 409 e preserva a nova foto.

A referência e o `AdminAuditLog` são gravados na mesma transação. O evento continua `USER_AVATAR_REMOVED`, com administrador responsável, `targetType: USER`, ID do alvo e metadata `{ hadAvatar: boolean }`. Cada solicitação bem-sucedida é auditada, inclusive sem foto. Falha no banco/auditoria aborta a transação e não toca no storage. A exclusão no Cloudinary ocorre somente após o commit; se falhar, a referência permanece removida e um warning é registrado.

## Validação e ativação posterior

Os testes `cloudinary-avatar-storage.spec.ts`, `user-avatar.spec.ts` e `admin.avatar.spec.ts` usam SDK, storage e banco simulados. Cobrem formatos, tamanho, autenticação, URLs/IDs, substituição, exclusão, concorrência, auditoria, falhas e referências legadas. Não usam credenciais reais nem serviços externos.

Para repetir o QA visual existente, iniciar somente o frontend local em `http://127.0.0.1:3101` e executar `npm run test:avatar` ou `npm run test:admin-avatar:browser` em `frontend`. Os scripts usam Playwright em `%LOCALAPPDATA%\MatchPredict-Browser-QA`, interceptam APIs e gravam screenshots na pasta externa `artifacts`. `MATCHPREDICT_QA_RUNTIME` e `MATCHPREDICT_QA_URL` ajustam runtime e URL.

Configuração real, teste integrado com conta de teste e eventual deploy são etapas posteriores. Nenhum `.env` real, migration ou deploy é executado por esta implementação.
