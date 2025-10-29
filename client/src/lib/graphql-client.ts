const DEFAULT_ENDPOINT = '/query'

const GRAPHQL_ENDPOINT =
  import.meta.env.VITE_GRAPHQL_ENDPOINT?.toString() ?? DEFAULT_ENDPOINT

interface GraphQLError {
  message: string
}

interface GraphQLResponse<T> {
  data?: T
  errors?: GraphQLError[]
}

export async function requestGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    signal,
  })

  if (!response.ok) {
    throw new Error(`GraphQL request failed with status ${response.status}`)
  }

  const body = (await response.json()) as GraphQLResponse<T>

  if (body.errors?.length) {
    throw new Error(body.errors.map((err) => err.message).join('\n'))
  }

  if (!body.data) {
    throw new Error('GraphQL response missing data')
  }

  return body.data
}

interface UploadEnvelope<T> {
  uploadAudio: T
}

export async function uploadFileViaGraphQL<T>(
  query: string,
  fileFieldPath: string,
  file: File,
  variables?: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const formData = new FormData()

  formData.append(
    'operations',
    JSON.stringify({
      query,
      variables: {
        ...(variables ?? {}),
        [fileFieldPath]: null,
      },
    }),
  )

  formData.append(
    'map',
    JSON.stringify({
      0: [`variables.${fileFieldPath}`],
    }),
  )

  formData.append('0', file)

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    body: formData,
    signal,
  })

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`)
  }

  const body = (await response.json()) as GraphQLResponse<UploadEnvelope<T>>

  if (body.errors?.length) {
    throw new Error(body.errors.map((err) => err.message).join('\n'))
  }

  if (!body.data) {
    throw new Error('GraphQL response missing data')
  }

  return body.data.uploadAudio
}

export { GRAPHQL_ENDPOINT }
