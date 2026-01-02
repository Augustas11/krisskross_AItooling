import Link from 'next/link';

export default function LandingPage() {
    return (
        <div className="bg-white">
            {/* Header */}
            <header className="absolute inset-x-0 top-0 z-50">
                <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
                    <div className="flex lg:flex-1">
                        <a href="#" className="-m-1.5 p-1.5">
                            <span className="sr-only">KrissKross</span>
                            <span className="text-xl font-bold text-[#0040E5]">KrissKross.ai</span>
                        </a>
                    </div>
                    <div className="flex flex-1 justify-end">
                        <Link href="/login" className="text-sm font-semibold leading-6 text-gray-900 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">
                            Log in <span aria-hidden="true">&rarr;</span>
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <div className="relative isolate px-6 pt-14 lg:px-8">
                <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                            AI-Powered Lead Engine for E-Commerce
                        </h1>
                        <p className="mt-6 text-lg leading-8 text-gray-600">
                            Automate your outreach, discover high-intent leads, and manage your pipeline with the power of KrissKross Intelligence.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <Link
                                href="/login"
                                className="rounded-md bg-[#0040E5] px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0040E5]"
                            >
                                Go to CRM
                            </Link>
                            <a href="#" className="text-sm font-semibold leading-6 text-gray-900">
                                Learn more <span aria-hidden="true">→</span>
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
