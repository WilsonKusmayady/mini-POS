<?php

namespace App\Http\Controllers;

use App\Services\MemberService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use App\Models\Member;

class MemberController extends Controller
{
    protected $memberService;

    public function __construct(MemberService $memberService)
    {
        $this->memberService = $memberService;
    }

    /**
     * Display members index page
     */
    public function index()
    {
        return Inertia::render('members/index');
    }

    /**
     * API: Get paginated members
     */
    public function apiIndex(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|in:10,25,50,100',
            'search' => 'nullable|string|max:255',
            'gender' => 'nullable|in:0,1',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',    
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $filters = $request->only(['search', 'gender', 'start_date', 'end_date']);
            $perPage = $request->get('per_page', 10);
            $page = $request->get('page', 1);
            
            $members = $this->memberService->getPaginatedMembers($filters, $perPage, $page);
            
            return response()->json($members);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch members: ' . $e->getMessage()
            ], 500);
        }
    }

    public function apiStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20|unique:members,phone_number',
            'address' => 'required|string',
            'gender' => 'required|in:0,1',
            'birth_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $member = $this->memberService->createMember($request->all());
            
            return response()->json([
                'success' => true,
                'member' => $member,
                'message' => 'Member berhasil dibuat'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat member: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Show create member form
     */
    public function create()
    {
        return Inertia::render('members/create');
    }

    /**
     * Store new member
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'required|string',
            'gender' => 'required|boolean',
            'birth_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $member = $this->memberService->createMember($request->all());
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'member' => $member,
                    'message' => 'Member berhasil dibuat',
                ]);
            }

            // ✅ RESPONSE UNTUK FORM BIASA
            return redirect()
                ->route('members.index')
                ->with('success', 'Member berhasil ditambahkan');
                
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal menambahkan member: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Show member details
     */
    public function show(string $memberCode)
    {
        try {
            $member = $this->memberService->getMemberWithDetails($memberCode);
            
            return Inertia::render('members/show', [
                'member' => $member,
            ]);
            
        } catch (\Exception $e) {
            return redirect()->route('members.index')
                ->with('error', 'Member tidak ditemukan: ' . $e->getMessage());
        }
    }

    /**
     * Show edit member form
     */
    public function edit(string $memberCode)
    {
        try {
            $member = $this->memberService->getMember($memberCode);
            
            return Inertia::render('members/edit', [
                'member' => $member,
            ]);
            
        } catch (\Exception $e) {
            return redirect()->route('members.index')
                ->with('error', 'Member tidak ditemukan: ' . $e->getMessage());
        }
    }

    /**
     * Update member
     */
    public function update(Request $request, string $memberCode)
    {
        $validator = Validator::make($request->all(), [
            'member_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'required|string',
            'gender' => 'required|boolean',
            'birth_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $this->memberService->updateMember($memberCode, $request->all());
            
            return redirect()
                ->route('members.index')
                ->with('success', 'Member berhasil diperbarui');
                
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Gagal memperbarui member: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Delete member
     */
    public function destroy(string $memberCode)
    {
        try {
            $this->memberService->deleteMember($memberCode);
            
            return response()->json([
                'success' => true,
                'message' => 'Member berhasil dihapus'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus member: ' . $e->getMessage()
            ], 500);
        }
    }

    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'search' => 'nullable|string|max:255',
            'page' => 'nullable|integer|min:1',
            'per_page' => 'nullable|integer|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $search = $request->input('search', '');
            $perPage = $request->input('per_page', 20);
            $page = $request->input('page', 1);
            
            \Log::info('Searching members', [
                'search' => $search,
                'perPage' => $perPage,
                'page' => $page
            ]);
            
            // Panggil service dengan parameter yang benar
            $members = $this->memberService->searchMembers($search, $perPage, $page);
            
            \Log::info('Found members', ['count' => $members->count()]);
            
            // Format response
            return response()->json([
                'data' => $members->items(),
                'current_page' => $members->currentPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total(),
                'last_page' => $members->lastPage(),
                'next_page_url' => $members->nextPageUrl(),
                'prev_page_url' => $members->previousPageUrl(),
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in members search: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to search members: ' . $e->getMessage()
            ], 500);
        }
    }
}