<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\UserRepository;
use App\Repositories\Contracts\ItemRepositoryInterface;
use App\Repositories\ItemRepository;
use App\Repositories\Contracts\MemberRepositoryInterface;
use App\Repositories\MemberRepository;
use App\Repositories\Contracts\PurchaseRepositoryInterface;
use App\Repositories\PurchaseRepository;
use App\Repositories\Contracts\SaleRepositoryInterface;
use App\Repositories\SaleRepository;
use App\Repositories\Contracts\SupplierRepositoryInterface;
use App\Repositories\SupplierRepository;
use App\Repositories\Contracts\DashboardRepositoryInterface;
use App\Repositories\DashboardRepository;
use App\Repositories\Contracts\SummaryRepositoryInterface;
use App\Repositories\SummaryRepository;
use Carbon\Carbon;


class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            UserRepositoryInterface::class,
            UserRepository::class
        );
        $this->app->bind(
            ItemRepositoryInterface::class,
            ItemRepository::class
        );
        $this->app->bind(
            MemberRepositoryInterface::class,
            MemberRepository::class
        );
        $this->app->bind(
            PurchaseRepositoryInterface::class,
            PurchaseRepository::class
        );
        $this->app->bind(
            SaleRepositoryInterface::class,
            SaleRepository::class
        );
        $this->app->bind(
            DashboardRepositoryInterface::class,
            DashboardRepository::class
        );
        $this->app->bind(
            SummaryRepositoryInterface::class,
            SummaryRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Carbon::setLocale('id');
    }
}
