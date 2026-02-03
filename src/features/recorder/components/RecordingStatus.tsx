import { useRecorderStore } from '../stores/useRecorderStore'

export const RecordingStatus = () => {
  const status = useRecorderStore((state) => state.status)

  if (status === 'idle') {
    return (
      <div className='text-center py-8 text-gray-500'>
        <p>Click the button to start recording tab audio</p>
      </div>
    )
  }

  if (status === 'requesting') {
    return (
      <div className='text-center py-8'>
        <div className='animate-pulse text-indigo-500'>
          Requesting permission...
        </div>
      </div>
    )
  }

  return null
}
