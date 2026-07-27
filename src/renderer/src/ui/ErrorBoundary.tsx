import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Nhãn khu vực (VD "Wizard") để biết chỗ nào sập. */
  area?: string
}

interface State {
  error: Error | null
  info: ErrorInfo | null
}

/**
 * Bắt MỌI lỗi render trong cây con. Không có nó, một lỗi render lẻ sẽ
 * làm React gỡ sạch cây → cả app thành MÀN HÌNH ĐEN/TRẮNG (không thấy lỗi gì).
 * Ở đây ta hiện thẳng message + stack + component stack để soi được nguyên nhân.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, info: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({ info })
    // Ghi ra console renderer để còn xem trong DevTools nếu cần.
    console.error('[ErrorBoundary] render sập:', error, info)
  }

  reset = (): void => this.setState({ error: null, info: null })

  render(): ReactNode {
    const { error, info } = this.state
    if (!error) return this.props.children

    return (
      <div className="m-6 max-w-3xl rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-sm text-red-100">
        <h2 className="mb-2 text-lg font-bold text-red-200">
          Giao diện {this.props.area ?? ''} gặp lỗi (đã chặn, không sập app)
        </h2>
        <p className="mb-3 text-red-200/80">
          Đây là lỗi thật gây “màn hình đen”. Chụp lại đoạn dưới gửi cho dev để sửa gốc.
        </p>
        <div className="mb-2 font-mono text-xs text-red-100">
          <b>{error.name}:</b> {error.message}
        </div>
        {error.stack && (
          <pre className="mb-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-red-100/80">
            {error.stack}
          </pre>
        )}
        {info?.componentStack && (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-amber-100/70">
            {info.componentStack}
          </pre>
        )}
        <button
          className="mt-4 rounded-lg border border-red-400/40 px-4 py-2 text-red-100 hover:bg-red-500/20"
          onClick={this.reset}
        >
          Thử lại
        </button>
      </div>
    )
  }
}
