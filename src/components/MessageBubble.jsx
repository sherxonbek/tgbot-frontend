import { memo, useState, useRef } from 'react';
import { CheckCheck, Check, Play, Pause } from 'lucide-react';

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function VoiceMessage({ mediaUrl, isMe }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio
        ref={audioRef}
        src={mediaUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        preload="metadata"
      />
      <div
        className="flex items-center gap-2"
        style={{ minWidth: 150, maxWidth: 200 }}
      >
        <button
          onClick={togglePlay}
          className="flex items-center justify-center rounded-full flex-shrink-0 transition-all"
          style={{
            width: 34,
            height: 34,
            background: isMe ? 'rgba(255,255,255,0.22)' : 'linear-gradient(135deg, rgba(124,90,240,0.9), rgba(91,63,212,0.9))',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            boxShadow: isMe ? 'none' : '0 3px 12px rgba(124,90,240,0.4)',
            transition: 'transform 0.15s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.06)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: 1 }} />}
        </button>

        <div className="flex-1 min-w-0">
          <div
            className="h-1.5 rounded-full"
            style={{
              background: isMe ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)',
              overflow: 'hidden',
            }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: isMe ? '#fff' : 'linear-gradient(90deg, #7c5af0, #a78bfa)',
                boxShadow: isMe ? 'none' : '0 0 8px rgba(124,90,240,0.5)',
              }}
            />
          </div>
        </div>

        <span
          className="text-xs flex-shrink-0"
          style={{
            color: isMe ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.5)',
            fontVariantNumeric: 'tabular-nums',
            minWidth: 32,
            textAlign: 'right',
          }}
        >
          {playing ? formatTime(Math.floor(currentTime)) : formatTime(Math.floor(duration))}
        </span>
      </div>
    </>
  );
}

function MessageBubble({ message, prevSame, isMe }) {
  const showRead = isMe && message.read;
  const showDelivered = isMe && message.delivered === 'delivered';
  const isImage = message.type === 'image' && message.mediaUrl;
  const isVoice = message.type === 'voice' && message.mediaUrl;
  const isText = message.type === 'text' || (!isImage && !isVoice);

  const bubbleRadius = isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px';

  return (
    <div
      className="flex items-end gap-2"
      style={{
        justifyContent: isMe ? 'flex-end' : 'flex-start',
        marginTop: prevSame ? 2 : 10,
        animationName: 'fade-in-up',
        animationDuration: '0.25s',
        animationFillMode: 'both',
      }}
    >
      {!isMe && prevSame && <div style={{ width: 26, flexShrink: 0 }} />}
      <div style={{ maxWidth: isVoice ? '80%' : '72%' }}>
        {isText && (
          <div
            className="text-sm px-4 py-2.5 rounded-2xl"
            style={{
              background: isMe
                ? 'linear-gradient(135deg, #7c5af0, #5b3fd4)'
                : 'rgba(255,255,255,0.06)',
              border: isMe ? 'none' : '1px solid rgba(255,255,255,0.07)',
              color: isMe ? '#fff' : '#f0effc',
              borderRadius: bubbleRadius,
              boxShadow: isMe
                ? '0 4px 18px rgba(124,90,240,0.4), inset 0 1px 0 rgba(255,255,255,0.14)'
                : 'inset 0 1px 0 rgba(255,255,255,0.05)',
              wordBreak: 'break-word',
              lineHeight: '1.45',
            }}
          >
            {message.text}
          </div>
        )}

        {isImage && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              borderRadius: bubbleRadius,
              boxShadow: isMe
                ? '0 4px 18px rgba(124,90,240,0.35)'
                : '0 4px 16px rgba(0,0,0,0.3)',
              maxWidth: 260,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <img
              src={message.mediaUrl}
              alt="Shared image"
              className="w-full h-auto block"
              style={{ maxHeight: 300, objectFit: 'cover' }}
              loading="lazy"
            />
            {message.text && (
              <div
                className="text-sm px-3 py-2"
                style={{
                  background: isMe ? '#5b3fd4' : 'rgba(255,255,255,0.06)',
                  color: '#f0effc',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {message.text}
              </div>
            )}
          </div>
        )}

        {isVoice && (
          <div
            className="px-3.5 py-2.5 rounded-2xl"
            style={{
              background: isMe
                ? 'linear-gradient(135deg, #7c5af0, #5b3fd4)'
                : 'rgba(255,255,255,0.06)',
              border: isMe ? 'none' : '1px solid rgba(255,255,255,0.07)',
              borderRadius: bubbleRadius,
              boxShadow: isMe
                ? '0 4px 18px rgba(124,90,240,0.4), inset 0 1px 0 rgba(255,255,255,0.14)'
                : 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            <VoiceMessage mediaUrl={message.mediaUrl} isMe={isMe} />
          </div>
        )}

        <div
          className="text-xs mt-0.5 flex items-center gap-1"
          style={{
            color: 'rgba(255,255,255,0.22)',
            justifyContent: isMe ? 'flex-end' : 'flex-start',
            paddingLeft: isMe ? 0 : 4,
            paddingRight: isMe ? 4 : 0,
          }}
        >
          <span>{message.time}</span>
          {showRead && <CheckCheck size={13} style={{ color: '#60a5fa' }} />}
          {showDelivered && !showRead && <CheckCheck size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />}
          {isMe && !showDelivered && !showRead && <Check size={13} style={{ color: 'rgba(255,255,255,0.15)' }} />}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
