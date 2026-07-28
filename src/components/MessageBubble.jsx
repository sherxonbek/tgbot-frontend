import { memo } from 'react';

function MessageBubble({ message, prevSame, isMe }) {
  const isImage = message.type === 'image';
  const showRead = isMe && message.read;
  const showDelivered = isMe && message.delivered === 'delivered';

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
      <div style={{ maxWidth: '72%' }}>
        {isImage ? (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              borderRadius: isMe ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <img
              src={message.mediaUrl}
              alt="Shared image"
              className="block w-full"
              style={{ maxWidth: 240, maxHeight: 300, objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        ) : (
          <div
            className="text-sm px-3.5 py-2.5 rounded-2xl"
            style={{
              background: isMe ? 'linear-gradient(135deg, #7c5af0, #5b3fd4)' : 'rgba(255,255,255,0.07)',
              color: isMe ? '#fff' : '#f0effc',
              borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              boxShadow: isMe ? '0 2px 12px rgba(124,90,240,0.35)' : 'none',
              wordBreak: 'break-word',
              lineHeight: '1.45',
            }}
          >
            {message.text}
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
          {showRead && <span style={{ color: '#60a5fa' }}>✓✓</span>}
          {showDelivered && !showRead && <span style={{ color: 'rgba(255,255,255,0.3)' }}>✓✓</span>}
          {isMe && !showDelivered && !showRead && <span style={{ color: 'rgba(255,255,255,0.15)' }}>✓</span>}
        </div>
      </div>
    </div>
  );
}

export default memo(MessageBubble);
