import { useState, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'

import { jobsQueryOptions, uploadAudio } from '@/lib/jobs'

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(jobsQueryOptions())
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to prefetch jobs. The API might be offline.', error)
      }
    }
  },
  component: UploadPage,
})

function UploadPage() {
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const jobsQuery = useQuery(jobsQueryOptions())

  const mutation = useMutation({
    mutationFn: async (file: File) => uploadAudio(file),
    onMutate: () => {
      setStatusMessage('Uploading file...')
    },
    onSuccess: (job) => {
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setStatusMessage(
        `Upload complete. Job ${job.id.slice(0, 8)} saved as ${getBasename(
          job.filename,
        )}.`,
      )
      queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to upload file.'
      setStatusMessage(message)
    },
  })

  const jobs = jobsQuery.data ?? []
  const isBackendOffline = jobsQuery.isError

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <section>
        <Card>
          <CardHeader>
            <CardTitle>Upload Audio</CardTitle>
            <CardDescription>
              Select an audio file to send to the mixer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                if (!selectedFile) {
                  setStatusMessage('Pick a file before uploading.')
                  return
                }
                mutation.mutate(selectedFile)
              }}
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="audio-file">Audio file</Label>
                <Input
                  id="audio-file"
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*"
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0] ?? null
                    setSelectedFile(file)
                    setStatusMessage(null)
                  }}
                  disabled={mutation.isPending}
                  aria-invalid={!selectedFile && mutation.isError}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!selectedFile || mutation.isPending}>
                  {mutation.isPending ? 'Uploading...' : 'Upload'}
                </Button>
                {selectedFile ? (
                  <span className="text-sm text-muted-foreground">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </span>
                ) : null}
              </div>
              {mutation.isPending ? <Progress value={45} aria-label="Uploading" /> : null}
              {statusMessage ? (
                <p className="text-sm text-muted-foreground">{statusMessage}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>
              Monitor the files you've sent to the backend.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isBackendOffline ? (
              <p className="text-sm text-destructive">
                Can't reach the backend right now. We'll load your jobs once it comes back
                online.
              </p>
            ) : jobs.length ? (
              <ul className="flex flex-col gap-3">
                {jobs.map((job) => (
                  <li
                    key={job.id}
                    className="flex items-center justify-between rounded-md border border-border px-4 py-3"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">
                        {getBasename(job.filename)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Job #{job.id}
                      </span>
                    </div>
                    <span className="text-sm uppercase tracking-wide text-primary">
                      {job.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No uploads yet. Start by sending your first file.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function getBasename(path: string) {
  const parts = path.split(/\\|\//)
  return parts[parts.length - 1] || path
}

function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B'
  }
  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(
    Math.floor(Math.log(size) / Math.log(1024)),
    units.length - 1,
  )
  const value = size / 1024 ** exponent
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}
