import DOMPurify from 'isomorphic-dompurify';

const SANITIZE_OPTIONS = {
  ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'a', 'br', 'blockquote'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
};

type RichTextProps = {
  html: string;
  className?: string;
};

export function RichText({ html, className }: RichTextProps) {
  const sanitized = DOMPurify.sanitize(html, SANITIZE_OPTIONS);
  return (
    <div
      className={[
        '[&_a]:underline [&_blockquote]:border-s-2 [&_blockquote]:border-current [&_blockquote]:ps-3 [&_li]:ms-5 [&_ol]:list-decimal [&_p+p]:mt-2 [&_ul]:list-disc',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
