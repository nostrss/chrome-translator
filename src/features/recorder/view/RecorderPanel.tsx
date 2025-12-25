import { useAppSelector } from '@/store'
import { selectError } from '@/features/recorder/model/recorderSelectors'
import { RecordButton } from './RecordButton'
import { RecordingStatus } from './RecordingStatus'
import { LanguageDropdown } from './LanguageDropdown'
import { TargetLanguageDropdown } from './TargetLanguageDropdown'
import { TranscriptDisplay } from './TranscriptDisplay'

export const RecorderPanel = () => {
  const error = useAppSelector(selectError)

  return (
    <div className='h-screen bg-white p-4 flex flex-col'>
      <div className='max-w-md mx-auto w-full flex flex-col flex-1 min-h-0'>
        <div className='bg-white flex flex-col flex-1 min-h-0'>
          <LanguageDropdown />
          <TargetLanguageDropdown />
          <RecordButton />
          <RecordingStatus />
          <TranscriptDisplay />

          {error && (
            <div className='mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm'>
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
