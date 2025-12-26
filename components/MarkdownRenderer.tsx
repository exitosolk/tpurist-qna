import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose max-w-none">
      <ReactMarkdown
        components={{
          img: ({ node, ...props }) => (
            <img
              {...props}
              className="max-w-full h-auto rounded-lg my-4"
              alt={props.alt || "Image"}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              {...props}
              className="text-blue-600 hover:underline"
              target={props.href?.startsWith("http") ? "_blank" : undefined}
              rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
            />
          ),
          code: ({ node, inline, ...props }: any) =>
            inline ? (
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono" {...props} />
            ) : (
              <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4 font-mono text-sm" {...props} />
            ),
          pre: ({ node, ...props }) => <div {...props} />,
          p: ({ node, ...props }) => <p className="mb-4" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 mt-6" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 mt-5" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 mt-4" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
