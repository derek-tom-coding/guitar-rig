import { queryOptions } from '@tanstack/react-query'

import { requestGraphQL, uploadFileViaGraphQL } from './graphql-client'

export interface Job {
  id: string
  filename: string
  status: string
}

const JOBS_QUERY = /* GraphQL */ `
  query Jobs {
    jobs {
      id
      filename
      status
    }
  }
`

const UPLOAD_AUDIO_MUTATION = /* GraphQL */ `
  mutation UploadAudio($file: Upload!) {
    uploadAudio(file: $file) {
      id
      filename
      status
    }
  }
`

export function jobsQueryOptions() {
  return queryOptions({
    queryKey: ['jobs'],
    queryFn: async ({ signal }) => {
      const { jobs } = await requestGraphQL<{ jobs: Job[] }>(
        JOBS_QUERY,
        undefined,
        signal,
      )
      return jobs
    },
    retry: false,
  })
}

export async function uploadAudio(file: File, signal?: AbortSignal) {
  return uploadFileViaGraphQL<Job>(
    UPLOAD_AUDIO_MUTATION,
    'file',
    file,
    undefined,
    signal,
  )
}
