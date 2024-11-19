import Link from 'next/link'
import InputForm from './InputForm'
import { getSummary } from './actions'

export default function Home() {
    return (
        <div className="grid justify-items-center min-h-screen p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-1 flex-col gap-8 pt-20 w-[70%]">
                <h1 className="text-4xl font-bold text-center">Extend-ai</h1>
                <InputForm type="online" formSubmit={getSummary} />
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
                <Link
                    className="flex items-center gap-2 italic underline underline-offset-4 hover:decoration-wavy hover:underline-offset-4"
                    href="/offline"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    use offline mode
                </Link>
            </footer>
        </div>
    )
}
