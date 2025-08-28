
import Link from 'next/link';
import {StoreLanding} from "@/client/modules/stores/components/Listing";
import StoresHeroSection from "@/client/modules/stores/components/HeroSection";
import {Store} from "@/lib/modules/stores/schema/store";

export default function HomePageView({stores}: { stores: Store[] }) {

    return (
        <div className="min-h-screen -mt-20 pt-20 ">

            <StoresHeroSection/>

            {/* Featured Stores Section */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl text-center">
                        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Featured Stores
                        </h2>
                        <p className="mt-2 text-lg leading-8 text-gray-600 dark:text-gray-300">
                            Check out some of our most popular stores
                        </p>
                    </div>

                    <div className="mx-auto mt-16">
                        <StoreLanding stores={stores}/>

                        {/* View All Stores CTA */}
                        {stores.length > 0 && (
                            <div className="mt-12 text-center">
                                <Link
                                    href="/stores"
                                    className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                                >
                                    View All Stores
                                    <svg className="-mr-1 h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd"
                                              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                                              clipRule="evenodd"/>
                                    </svg>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="bg-white dark:bg-gray-800 py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:max-w-none">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                                Per Diem by the Numbers
                            </h2>
                            <p className="mt-4 text-lg leading-8 text-gray-600 dark:text-gray-300">
                                Trusted by businesses and customers worldwide
                            </p>
                        </div>
                        <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-4">
                            <div className="flex flex-col bg-gray-400/5 p-8 dark:bg-gray-600/5">
                                <dt className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">Active
                                    Stores
                                </dt>
                                <dd className="order-first text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{stores.length}+
                                </dd>
                            </div>
                            <div className="flex flex-col bg-gray-400/5 p-8 dark:bg-gray-600/5">
                                <dt className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">Availability
                                </dt>
                                <dd className="order-first text-3xl font-bold tracking-tight text-gray-900 dark:text-white">24/7
                                </dd>
                            </div>
                            <div className="flex flex-col bg-gray-400/5 p-8 dark:bg-gray-600/5">
                                <dt className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">Timezone
                                    Aware
                                </dt>
                                <dd className="order-first text-3xl font-bold tracking-tight text-gray-900 dark:text-white">100%
                                </dd>
                            </div>
                            <div className="flex flex-col bg-gray-400/5 p-8 dark:bg-gray-600/5">
                                <dt className="text-sm font-semibold leading-6 text-gray-600 dark:text-gray-400">Real-time
                                    Status
                                </dt>
                                <dd className="order-first text-3xl font-bold tracking-tight text-gray-900 dark:text-white">⚡
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 sm:py-32">
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                    <div className="mx-auto max-w-2xl lg:text-center">
                        <h2 className="text-base font-semibold leading-7 text-blue-600">Advanced Features</h2>
                        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Everything you need to manage your stores
                        </p>
                        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                            Our platform provides comprehensive tools for store management, real-time availability
                            tracking, and seamless customer experiences.
                        </p>
                    </div>
                    <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                            <div className="flex flex-col">
                                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                                    <svg className="h-5 w-5 flex-none text-blue-600" viewBox="0 0 20 20"
                                         fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L9.53 11.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                              clipRule="evenodd"/>
                                    </svg>
                                    Real-time Availability
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                                    <p className="flex-auto">Get instant updates on store availability and product status
                                        with our real-time tracking system.</p>
                                </dd>
                            </div>
                            <div className="flex flex-col">
                                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                                    <svg className="h-5 w-5 flex-none text-blue-600" viewBox="0 0 20 20"
                                         fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L9.53 11.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                              clipRule="evenodd"/>
                                    </svg>
                                    Timezone Management
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                                    <p className="flex-auto">Automatic timezone detection and conversion ensures accurate
                                        scheduling across all locations.</p>
                                </dd>
                            </div>
                            <div className="flex flex-col">
                                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                                    <svg className="h-5 w-5 flex-none text-blue-600" viewBox="0 0 20 20"
                                         fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd"
                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L9.53 11.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                                              clipRule="evenodd"/>
                                    </svg>
                                    Seamless Integration
                                </dt>
                                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                                    <p className="flex-auto">Easy integration with existing systems and APIs for a smooth
                                        transition to our platform.</p>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </section>

        </div>
    );
}
