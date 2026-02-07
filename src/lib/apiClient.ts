// lib/apiClient.ts
import { useAuth } from '@/context/AuthContext'

const API_BASE_URL = 'https://cybertap.razniewski.eu'

export interface UserInfo {
  id: number
  user_id: string
  org_id: number
  pub_id: number
  role: string
  organization_name: string
  pub_name: string
  created_at: string
  updated_at: string
}


// Base product interface with common fields (snake_case matching Go backend)
export interface BaseProduct {
  id: number
  name: string
  type: string
  organization_id: number
  uuid: string
  created_at: string
  updated_at: string
  created_by: string
  price_per_visible_volume: number
  visible_volume: number
  default_warehouse_volume: number
  active: boolean
  main_image_resource_uuid?: string
  glass_image_resource_uuid?: string
}

export interface BeerProduct extends BaseProduct {
  bitterness: number
  sweetness: number
  acidity: number
  extract: number
  alcohol: number
  brewery: string
  style: string
}

export interface HardProduct extends BaseProduct {
  sweetness: number
  smokyness: number
  wood: number
  strongness: number
  extract: number
  alcohol: number
  style: string
}

export interface WineProduct extends BaseProduct {
  bitterness: number
  sweetness: number
  acidity: number
  extract: number
  alcohol: number
  style: string
}

export type NonAlcoProduct = BaseProduct

export type Product = BeerProduct | HardProduct | WineProduct | NonAlcoProduct



export interface ProductListParams {
  organizationId: number
  page?: number
  limit?: number
  search?: string
}

export interface PaginatedProductsResponse<T> {
  data: T[]
  pagination: PaginationMeta
}

export interface UpdateBeerRequest {
  id: number
  name: string
  main_image_resource_uuid?: string | null
  glass_image_resource_uuid?: string | null
  bitterness: number
  sweetness: number
  acidity: number
  extract: number
  alcohol: number
  brewery: string
  style: string
  price_per_visible_volume: number
  visible_volume: number
  default_warehouse_volume: number
  active: boolean
}

export interface UpdateHardRequest {
  id: number
  name: string
  main_image_resource_uuid?: string | null
  glass_image_resource_uuid?: string | null
  sweetness: number
  smokyness: number
  wood: number
  strongness: number
  extract: number
  alcohol: number
  style: string
  price_per_visible_volume: number
  visible_volume: number
  default_warehouse_volume: number
  active: boolean
}

export interface UpdateWineRequest {
  id: number
  name: string
  main_image_resource_uuid?: string | null
  glass_image_resource_uuid?: string | null
  bitterness: number
  sweetness: number
  acidity: number
  extract: number
  alcohol: number
  style: string
  price_per_visible_volume: number
  visible_volume: number
  default_warehouse_volume: number
  active: boolean
}

export interface UpdateNonAlcoholicRequest {
  id: number
  name: string
  main_image_resource_uuid?: string | null
  glass_image_resource_uuid?: string | null
  price_per_visible_volume: number
  visible_volume: number
  default_warehouse_volume: number
  active: boolean
}


export interface TapDeviceInfo {
  id: number
  org_id: number
  pub_id: number | null
  created_at: string
  updated_at: string
  precision: number
  uuid: string
  last_connected_at: string | null
  tap_slot_id?: number
  tap_slot_number?: number
}

export interface CashDeskInfo {
  id: number
  org_id: number
  pub_id: number | null
  created_at: string
  updated_at: string
  created_by: string | null
  last_connected_at: string | null
  uuid: string
}

export interface DevicesResponse {
  taps: TapDeviceInfo[]
  cashdesks: CashDeskInfo[]
}

export interface CreateResourceRequest {
  organization_id: number
  file: File
}

export interface Resource {
  uuid: string
  organization_id: number
  created_at: string
  updated_at: string
  storage_key: string
  filename: string
  size: number
  content_type: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
  has_next: boolean
  has_prev: boolean
}

export interface PaginatedResourcesResponse {
  data: Resource[]
  pagination: PaginationMeta
}

export interface ResourceListParams {
  organizationId: number
  page?: number
  limit?: number
  search?: string
}

export interface CreateBeerRequest {
  name: string
  main_image_resource_uuid?: string
  glass_image_resource_uuid?: string
  bitterness: number
  sweetness: number
  acidity: number
  extract: number
  alcohol: number
  brewery: string
  style: string
  price_per_visible_volume: number
  visible_volume: number
  default_warehouse_volume: number
  org_id: number
}

export interface CreateHardRequest {
  name: string
  main_image_resource_uuid?: string
  glass_image_resource_uuid?: string
  sweetness: number
  smokyness: number
  wood: number
  strongness: number
  extract: number
  alcohol: number
  style: string
  price_per_visible_volume: number
  visible_volume: number
  default_warehouse_volume: number
  org_id: number
}

export interface CreateWineRequest {
  name: string
  main_image_resource_uuid?: string
  glass_image_resource_uuid?: string
  bitterness: number
  sweetness: number
  acidity: number
  extract: number
  alcohol: number
  style: string
  price_per_visible_volume: number
  visible_volume: number
  default_warehouse_volume: number
  org_id: number
}


export interface LuckyPourConfig {
  id: number
  organization_id: number
  pub_id: number
  enabled: boolean
  chance_percent: number
  reward_amount: number
  min_pour_volume: number | null
  min_pour_cost: number | null
  max_wins_per_day_per_account: number | null
  max_wins_per_shift: number | null
  daily_budget: number | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface UpsertLuckyPourRequest {
  pub_id: number
  enabled: boolean
  chance_percent: number
  reward_amount: number
  min_pour_volume?: number | null
  min_pour_cost?: number | null
  max_wins_per_day_per_account?: number | null
  max_wins_per_shift?: number | null
  daily_budget?: number | null
}

export interface CreateNonAlcoholicRequest {
  name: string
  main_image_resource_uuid?: string
  glass_image_resource_uuid?: string
  price_per_visible_volume: number
  visible_volume: number
  default_warehouse_volume: number
  org_id: number
}

export interface CreateTapSlotRequest {
  org_id: number
  pub_id: number
  position: number
}

export interface Promo {
  id: number
  organization_id: number
  pub_id: number | null
  product_id: number | null
  product_type: string | null
  name: string
  discount_percent: number
  valid_from: string
  valid_to: string | null
  recurrent: boolean
  recurrent_days: number[] | null
  recurrent_time_from: string | null
  recurrent_time_to: string | null
  active: boolean
  priority: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface CreatePromoRequest {
  organization_id: number
  pub_id?: number | null
  product_id?: number | null
  product_type?: string | null
  name: string
  discount_percent: number
  valid_from?: string
  valid_to?: string | null
  recurrent: boolean
  recurrent_days?: number[]
  recurrent_time_from?: string | null
  recurrent_time_to?: string | null
  priority?: number
}

export interface UpdatePromoRequest {
  promo_id: number
  pub_id?: number | null
  product_id?: number | null
  product_type?: string | null
  name?: string
  discount_percent?: number
  valid_from?: string
  valid_to?: string | null
  recurrent?: boolean
  recurrent_days?: number[]
  recurrent_time_from?: string | null
  recurrent_time_to?: string | null
  active?: boolean
  priority?: number
}

export interface PromoListParams {
  organizationId: number
  pubId?: number
  page?: number
  limit?: number
  activeOnly?: boolean
}

export interface TapSlot {
  id: number
  organization_id: number
  pub_id: number
  position: number
  precision: number
  created_at: string
  updated_at: string
  created_by: string
  tap_id: number | null
}

export interface ShiftInfo {
  id: number
  organization_id: number
  pub_id: number
  started_at: string | null
  finished_at: string | null
  total_topups: number
  total_sales: number
}

export interface TopupStats {
  total_amount: number
  total_count: number
  average_amount: number
}

export interface ProductSaleStats {
  product_name: string
  total_volume: number
  total_revenue: number
  transaction_count: number
}

export interface SalesStats {
  total_revenue: number
  total_volume: number
  transaction_count: number
  average_transaction: number
}

export interface VisitsStats {
  new_accounts: number
  active_accounts: number
}

export interface TopupDetail {
  id: number
  amount: number
  created_at: string
  shift_id: number
  account_uuid: string
}

export interface PaginatedTopupDetailsResponse {
  data: TopupDetail[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
    has_next: boolean
    has_prev: boolean
  }
}


export interface TapSlotWithProduct extends TapSlot {
  product_name: string | null
  product_id: number | null
  product_type: string | null
  main_image_resource_uuid: string | null
  total_volume: number | null
  charged_volume: number | null
  blocked: boolean
}

export interface AssignTapSlotRequest {
  tap_id: number
  tap_slot_id: number
}

export interface CreateWarehouseItemRequest {
  product_id: number
  quantity: number
  org_id: number
  pub_id: number
  volume: number
}

export interface AssignWarehouseItemRequest {
  warehouse_item_id: number
  tap_slot_id: number
}


export interface WarehouseItem {
  id: number
  product_id: number
  organization_id: number
  pub_id: number
  created_at: string
  created_by: string
  updated_at: string
  volume: number
  charged_volume: number
  taken_off_at: string | null
  taken_off_note: string | null
  // Extra fields from join
  product_name: string
  product_type: string
  product_uuid: string
  price_per_visible_volume: number
  visible_volume: number
  tap_assignment_id: number | null
  tap_slot_position: number | null
}


export interface WarehouseListParams {
  organizationId: number
  pubId: number
  page?: number
  limit?: number
  search?: string
  activeOnly?: boolean
}

export interface TakeOffWarehouseItemRequest {
  warehouse_item_id: number
  note?: string
}

// ==================== USER MANAGEMENT TYPES ====================

export interface UserWithRole {
  user_id: string
  email: string
  role: string
  pub_id: number | null
  pub_name: string | null
  created_at: string
}

export interface ListUsersResponse {
  users: UserWithRole[]
  requesting_role: string
  can_manage_admins: boolean
}

export interface AddUserRequest {
  email: string
  password?: string
  organization_id: number
  pub_id?: number | null
  role: string
}

export interface ChangeRoleRequest {
  target_user_id: string
  organization_id: number
  new_role: string
  pub_id?: number | null
}

export interface RemoveUserRequest {
  target_user_id: string
  organization_id: number
}

export interface ChangePasswordRequest {
  target_user_id: string
  organization_id: number
  new_password: string
}


class ApiClient {
  private getAuthHeaders(session: any) {
    if (!session?.access_token) {
      throw new Error('No access token available')
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  async getLuckyPourConfig(session: any, pubId: number): Promise<LuckyPourConfig | null> {
    const response = await fetch(`${API_BASE_URL}/user/game/luckypour/get`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ pub_id: pubId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get lucky pour config: ${response.statusText}`)
    }

    const data = await response.json()
    return data || null
  }

  async upsertLuckyPourConfig(session: any, data: UpsertLuckyPourRequest): Promise<LuckyPourConfig> {
    const response = await fetch(`${API_BASE_URL}/user/game/luckypour/upsert`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to upsert lucky pour config: ${response.statusText}`)
    }

    return response.json()
  }

  async toggleLuckyPour(session: any, pubId: number, enabled: boolean): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/user/game/luckypour/toggle`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ pub_id: pubId, enabled }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to toggle lucky pour: ${response.statusText}`)
    }

    return response.json()
  }

  async deleteLuckyPourConfig(session: any, pubId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/user/game/luckypour/delete`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ pub_id: pubId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to delete lucky pour config: ${response.statusText}`)
    }

    return response.json()
  }



  private getAuthHeadersForFormData(session: any) {
    if (!session?.access_token) {
      throw new Error('No access token available')
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
    }
  }

  // ==================== USER MANAGEMENT ENDPOINTS ====================

  async listOrganizationUsers(session: any, organizationId: number): Promise<ListUsersResponse> {
    const response = await fetch(`${API_BASE_URL}/user/org/users?organization_id=${organizationId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to list users: ${response.statusText}`)
    }

    return response.json()
  }

  async addUserToOrganization(session: any, data: AddUserRequest): Promise<{ message: string; user_id: string; email: string; role: string }> {
    const response = await fetch(`${API_BASE_URL}/user/org/user/add`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to add user: ${response.statusText}`)
    }

    return response.json()
  }

  async changeUserRole(session: any, data: ChangeRoleRequest): Promise<{ message: string; previous_role: string; new_role: string }> {
    const response = await fetch(`${API_BASE_URL}/user/org/user/role`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to change role: ${response.statusText}`)
    }

    return response.json()
  }

  async removeUserFromOrganization(session: any, data: RemoveUserRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/user/org/user/remove`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to remove user: ${response.statusText}`)
    }

    return response.json()
  }

  async createPromo(session: any, data: CreatePromoRequest): Promise<Promo> {
    const response = await fetch(`${API_BASE_URL}/user/promo/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to create promo: ${response.statusText}`)
    }

    return response.json()
  }

  async updatePromo(session: any, data: UpdatePromoRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/user/promo/update`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to update promo: ${response.statusText}`)
    }

    return response.json()
  }

  async setTapSlotPrecision(session: any, tapSlotId: number, precision: number): Promise<{message: string, tap_slot: TapSlot}> {
    const response = await fetch(`${API_BASE_URL}/user/device/precision`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({
        tap_slot_id: tapSlotId,
        precision: precision
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to set tap slot precision: ${response.statusText}`)
    }

    return response.json()
  }

  async unassignTapSlot(session: any, tapSlotId: number): Promise<{message: string}> {
    const response = await fetch(`${API_BASE_URL}/user/tapslot/unassign`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ tap_slot_id: tapSlotId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to unassign tap slot: ${response.statusText}`)
    }

    return response.json()
  }

  async updateBeer(session: any, data: UpdateBeerRequest): Promise<{message: string, beer_id: number}> {
    const response = await fetch(`${API_BASE_URL}/user/beer/update`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to update beer: ${response.statusText}`)
    }

    return response.json()
  }

  async updateHard(session: any, data: UpdateHardRequest): Promise<{message: string, hard_id: number}> {
    const response = await fetch(`${API_BASE_URL}/user/hard/update`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to update hard: ${response.statusText}`)
    }

    return response.json()
  }

  async updateWine(session: any, data: UpdateWineRequest): Promise<{message: string, wine_id: number}> {
    const response = await fetch(`${API_BASE_URL}/user/wine/update`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to update wine: ${response.statusText}`)
    }

    return response.json()
  }

  async updateNonAlcoholic(session: any, data: UpdateNonAlcoholicRequest): Promise<{message: string, non_alco_id: number}> {
    const response = await fetch(`${API_BASE_URL}/user/nonalco/update`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to update non-alcoholic: ${response.statusText}`)
    }

    return response.json()
  }





  async listPromos(session: any, params: PromoListParams): Promise<PaginatedProductsResponse<Promo>> {
    const searchParams = new URLSearchParams({
      organization_id: params.organizationId.toString(),
    })

    if (params.pubId) {
      searchParams.append('pub_id', params.pubId.toString())
    }
    if (params.page) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.activeOnly) {
      searchParams.append('active_only', 'true')
    }

    const response = await fetch(`${API_BASE_URL}/user/promo/list?${searchParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to list promos: ${response.statusText}`)
    }

    return response.json()
  }

  async deletePromo(session: any, promoId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/user/promo/delete`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ promo_id: promoId }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to delete promo: ${response.statusText}`)
    }

    return response.json()
  }

  async changeUserPassword(session: any, data: ChangePasswordRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/user/org/user/password`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `Failed to change password: ${response.statusText}`)
    }

    return response.json()
  }

  // ==================== STATS ENDPOINTS ====================

  async listShifts(
      session: any,
      params: {
        organizationId: number
        pubId?: number
        startDate?: string
        endDate?: string
      }
  ): Promise<ShiftInfo[]> {
    const searchParams = new URLSearchParams({
      organization_id: params.organizationId.toString(),
    })
    if (params.pubId) {
      searchParams.append('pub_id', params.pubId.toString())
    }
    if (params.startDate) {
      searchParams.append('start_date', params.startDate)
    }
    if (params.endDate) {
      searchParams.append('end_date', params.endDate)
    }

    const response = await fetch(`${API_BASE_URL}/user/stats/shifts?${searchParams}`, {
      method: 'GET',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to list shifts: ${response.statusText}`)
    }

    return response.json()
  }

  async getTopupStats(
      session: any,
      params: {
        organizationId: number
        pubId?: number
        shiftIds: number[]
      }
  ): Promise<TopupStats> {
    const response = await fetch(`${API_BASE_URL}/user/stats/topups`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({
        organization_id: params.organizationId,
        pub_id: params.pubId,
        shift_ids: params.shiftIds,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get topup stats: ${response.statusText}`)
    }

    return response.json()
  }

  async getProductStats(
      session: any,
      params: {
        organizationId: number
        pubId?: number
        shiftIds: number[]
      }
  ): Promise<ProductSaleStats[]> {
    const response = await fetch(`${API_BASE_URL}/user/stats/products`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({
        organization_id: params.organizationId,
        pub_id: params.pubId,
        shift_ids: params.shiftIds,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get product stats: ${response.statusText}`)
    }

    return response.json()
  }

  async getSalesStats(
      session: any,
      params: {
        organizationId: number
        pubId?: number
        shiftIds: number[]
      }
  ): Promise<SalesStats> {
    const response = await fetch(`${API_BASE_URL}/user/stats/sales`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({
        organization_id: params.organizationId,
        pub_id: params.pubId,
        shift_ids: params.shiftIds,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get sales stats: ${response.statusText}`)
    }

    return response.json()
  }

  async getVisitsStats(
      session: any,
      params: {
        organizationId: number
        pubId?: number
        shiftIds: number[]
      }
  ): Promise<VisitsStats> {
    const response = await fetch(`${API_BASE_URL}/user/stats/visits`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({
        organization_id: params.organizationId,
        pub_id: params.pubId,
        shift_ids: params.shiftIds,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get visits stats: ${response.statusText}`)
    }

    return response.json()
  }

  async getTopupDetails(
      session: any,
      params: {
        organizationId: number
        pubId?: number
        shiftIds: number[]
        page?: number
        limit?: number
      }
  ): Promise<PaginatedTopupDetailsResponse> {
    const response = await fetch(`${API_BASE_URL}/user/stats/topups/details`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({
        organization_id: params.organizationId,
        pub_id: params.pubId,
        shift_ids: params.shiftIds,
        page: params.page || 1,
        limit: params.limit || 20,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to get topup details: ${response.statusText}`)
    }

    return response.json()
  }

  async getMe(session: any): Promise<UserInfo[]> {
    const response = await fetch(`${API_BASE_URL}/user/me`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`)
    }

    return response.json()
  }

  // Add these methods to the ApiClient class

  // Beer endpoints
  async listBeers(session: any, params: ProductListParams): Promise<PaginatedProductsResponse<BeerProduct>> {
    const searchParams = new URLSearchParams({
      organization_id: params.organizationId.toString(),
    })

    if (params.page) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.search) {
      searchParams.append('search', params.search)
    }

    const response = await fetch(`${API_BASE_URL}/user/beer/list?${searchParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to list beers: ${response.statusText}`)
    }

    return response.json()
  }

  // Hard drinks endpoints
  async listHards(session: any, params: ProductListParams): Promise<PaginatedProductsResponse<HardProduct>> {
    const searchParams = new URLSearchParams({
      organization_id: params.organizationId.toString(),
    })

    if (params.page) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.search) {
      searchParams.append('search', params.search)
    }

    const response = await fetch(`${API_BASE_URL}/user/hard/list?${searchParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to list hard drinks: ${response.statusText}`)
    }

    return response.json()
  }


  async blockTapSlot(session: any, tapSlotId: number): Promise<{message: string}> {
    const response = await fetch(`${API_BASE_URL}/user/tap/block`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ tap_slot_id: tapSlotId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to block tap slot: ${response.statusText}`)
    }

    return response.json()
  }

  async unblockTapSlot(session: any, tapSlotId: number): Promise<{message: string}> {
    const response = await fetch(`${API_BASE_URL}/user/tap/unblock`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ tap_slot_id: tapSlotId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to unblock tap slot: ${response.statusText}`)
    }

    return response.json()
  }


  async listWarehouse(session: any, params: WarehouseListParams): Promise<PaginatedProductsResponse<WarehouseItem>> {
    const searchParams = new URLSearchParams({
      organization_id: params.organizationId.toString(),
      pub_id: params.pubId.toString(),
    })

    if (params.page) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.search) {
      searchParams.append('search', params.search)
    }
    if (params.activeOnly !== undefined) {
      searchParams.append('active_only', params.activeOnly.toString())
    }

    const response = await fetch(`${API_BASE_URL}/user/warehouse/list?${searchParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to list warehouse: ${response.statusText}`)
    }

    return response.json()
  }

  async takeOffWarehouseItem(session: any, data: TakeOffWarehouseItemRequest): Promise<{message: string, warehouse_item: WarehouseItem}> {
    const response = await fetch(`${API_BASE_URL}/user/warehouse/takeoff`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to take off warehouse item: ${response.statusText}`)
    }

    return response.json()
  }

  // Wine endpoints
  async listWines(session: any, params: ProductListParams): Promise<PaginatedProductsResponse<WineProduct>> {
    const searchParams = new URLSearchParams({
      organization_id: params.organizationId.toString(),
    })

    if (params.page) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.search) {
      searchParams.append('search', params.search)
    }

    const response = await fetch(`${API_BASE_URL}/user/wine/list?${searchParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to list wines: ${response.statusText}`)
    }

    return response.json()
  }

  // Non-alcoholic drinks endpoints
  async listNonAlcoholics(session: any, params: ProductListParams): Promise<PaginatedProductsResponse<NonAlcoProduct>> {
    const searchParams = new URLSearchParams({
      organization_id: params.organizationId.toString(),
    })

    if (params.page) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.search) {
      searchParams.append('search', params.search)
    }

    const response = await fetch(`${API_BASE_URL}/user/nonalco/list?${searchParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to list non-alcoholic drinks: ${response.statusText}`)
    }

    return response.json()
  }

  // Resource endpoints with pagination support
  async createResource(session: any, file: File, organizationId: number): Promise<Resource> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('organization_id', organizationId.toString())

    const response = await fetch(`${API_BASE_URL}/user/resource/create`, {
      method: 'POST',
      headers: this.getAuthHeadersForFormData(session),
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Failed to create resource: ${response.statusText}`)
    }

    return response.json()
  }

  async listResources(session: any, params: ResourceListParams): Promise<PaginatedResourcesResponse> {
    const searchParams = new URLSearchParams({
      organization_id: params.organizationId.toString(),
    })

    if (params.page) {
      searchParams.append('page', params.page.toString())
    }
    if (params.limit) {
      searchParams.append('limit', params.limit.toString())
    }
    if (params.search) {
      searchParams.append('search', params.search)
    }

    const response = await fetch(`${API_BASE_URL}/user/resource/list?${searchParams}`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to list resources: ${response.statusText}`)
    }

    return response.json()
  }

  async downloadResource(session: any, uuid: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/user/resource/download?uuid=${uuid}`, {
      method: 'GET',
      headers: this.getAuthHeadersForFormData(session),
    })

    if (!response.ok) {
      throw new Error(`Failed to download resource: ${response.statusText}`)
    }

    return response.blob()
  }

  // Utility method to trigger download
  async downloadResourceFile(session: any, uuid: string, filename: string): Promise<void> {
    try {
      const blob = await this.downloadResource(session, uuid)

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()

      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
      throw error
    }
  }

  // Product creation endpoints
  async createBeer(session: any, data: CreateBeerRequest): Promise<{message: string, beer_id: number}> {
    const response = await fetch(`${API_BASE_URL}/user/beer/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create beer: ${response.statusText}`)
    }

    return response.json()
  }

  async createHard(session: any, data: CreateHardRequest): Promise<{message: string, hard_id: number}> {
    const response = await fetch(`${API_BASE_URL}/user/hard/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create hard drink: ${response.statusText}`)
    }

    return response.json()
  }

  async createWine(session: any, data: CreateWineRequest): Promise<{message: string, wine_id: number}> {
    const response = await fetch(`${API_BASE_URL}/user/wine/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create wine: ${response.statusText}`)
    }

    return response.json()
  }

  async createNonAlcoholic(session: any, data: CreateNonAlcoholicRequest): Promise<{message: string, non_alco_id: number}> {
    const response = await fetch(`${API_BASE_URL}/user/nonalco/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create non-alcoholic drink: ${response.statusText}`)
    }

    return response.json()
  }

  // Tap slot endpoints
  async createTapSlot(session: any, data: CreateTapSlotRequest): Promise<{message: string}> {
    const response = await fetch(`${API_BASE_URL}/user/tapslot/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create tap slot: ${response.statusText}`)
    }

    return response.json()
  }

  async listTapSlots(session: any, orgId: number, pubId: number): Promise<TapSlotWithProduct[]> {
    const response = await fetch(`${API_BASE_URL}/user/tapslot/list`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ org_id: orgId, pub_id: pubId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to list tap slots: ${response.statusText}`)
    }

    return response.json()
  }

  // Device assignment endpoints
  async assignTapToPub(session: any, tapId: number, pubId: number): Promise<{message: string}> {
    const response = await fetch(`${API_BASE_URL}/user/tap/assign`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ tap_id: tapId, pub_id: pubId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to assign tap to pub: ${response.statusText}`)
    }

    return response.json()
  }

  async assignCashdeskToPub(session: any, cashdeskId: number, pubId: number): Promise<{message: string}> {
    const response = await fetch(`${API_BASE_URL}/user/cashdesk/assign`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ cashdesk_id: cashdeskId, pub_id: pubId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to assign cashdesk to pub: ${response.statusText}`)
    }

    return response.json()
  }

  async assignTapSlot(session: any, data: AssignTapSlotRequest): Promise<{message: string}> {
    const response = await fetch(`${API_BASE_URL}/user/tap/assignslot`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to assign tap slot: ${response.statusText}`)
    }

    return response.json()
  }

  // Warehouse endpoints
  async createWarehouseItem(session: any, data: CreateWarehouseItemRequest): Promise<{message: string}> {
    const response = await fetch(`${API_BASE_URL}/user/warehouse/create`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to create warehouse item: ${response.statusText}`)
    }

    return response.json()
  }

  async listDevices(session: any, orgId: number): Promise<DevicesResponse> {
    const response = await fetch(`${API_BASE_URL}/user/device/list`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify({ org_id: orgId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to list devices: ${response.statusText}`)
    }

    return response.json()
  }

  async assignWarehouseItem(session: any, data: AssignWarehouseItemRequest): Promise<{message: string, tap_assignment_id: number}> {
    const response = await fetch(`${API_BASE_URL}/user/warehouse/assign`, {
      method: 'POST',
      headers: this.getAuthHeaders(session),
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Failed to assign warehouse item: ${response.statusText}`)
    }

    return response.json()
  }
}

export const apiClient = new ApiClient()