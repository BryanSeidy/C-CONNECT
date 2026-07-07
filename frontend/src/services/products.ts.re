diff a/frontend/src/services/products.ts b/frontend/src/services/products.ts	(rejected hunks)
@@ -61,55 +71,53 @@ export function normalizeProducts(raws: RawProduct[]): Product[] {
   return raws.map(normalizeProduct);
 }
 
-// ============================================================================
-// Product Service Layer
-// ============================================================================
+// ── Service ───────────────────────────────────────────────────────────────────
 
 export const productService = {
+  /** GET /api/catalogue/products — public, no auth */
   getProducts: async (params?: ProductFilters): Promise<ApiEnvelope<PaginatedResult<Product>>> => {
-    const res = await apiClient.get<unknown, ApiEnvelope<PaginatedResult<RawProduct>>>('/products', { params });
+    const res = await apiClient.get<unknown, ApiEnvelope<PaginatedResult<RawProduct>>>(
+      '/catalogue/products',
+      { params }
+    );
     return {
       ...res,
       data: {
-        items: normalizeProducts(res.data.items || []),
-        meta: res.data.meta,
+        items: normalizeProducts(res.data?.items ?? []),
+        meta:  res.data?.meta,
       },
     };
   },
 
-  getProductById: async (id: number | string): Promise<ApiEnvelope<Product>> => {
-    const res = await apiClient.get<unknown, ApiEnvelope<RawProduct>>(`/products/${id}`);
-    return {
-      ...res,
-      data: normalizeProduct(res.data),
-    };
+  /** GET /api/catalogue/products/:id — public */
+  getProductById: async (id: string | number): Promise<ApiEnvelope<Product>> => {
+    const res = await apiClient.get<unknown, ApiEnvelope<RawProduct>>(`/catalogue/products/${id}`);
+    return { ...res, data: normalizeProduct(res.data) };
   },
 
+  /** GET /api/products/me — auth required, seller only */
   getMyProducts: async (): Promise<ApiEnvelope<Product[]>> => {
     const res = await apiClient.get<unknown, ApiEnvelope<RawProduct[]>>('/products/me');
-    return {
-      ...res,
-      data: normalizeProducts(res.data || []),
-    };
+    return { ...res, data: normalizeProducts(res.data ?? []) };
   },
 
-  createProduct: async (productData: ProductMutationPayload): Promise<ApiEnvelope<Product>> => {
-    const res = await apiClient.post<unknown, ApiEnvelope<RawProduct>>('/products', productData);
-    return {
-      ...res,
-      data: normalizeProduct(res.data),
-    };
+  /** POST /api/products — auth required */
+  createProduct: async (payload: ProductMutationPayload): Promise<ApiEnvelope<Product>> => {
+    const res = await apiClient.post<unknown, ApiEnvelope<RawProduct>>('/products', payload);
+    return { ...res, data: normalizeProduct(res.data) };
   },
 
-  updateProduct: async (id: number | string, updateData: Partial<ProductMutationPayload>): Promise<ApiEnvelope<Product>> => {
-    const res = await apiClient.put<unknown, ApiEnvelope<RawProduct>>(`/products/${id}`, updateData);
-    return {
-      ...res,
-      data: normalizeProduct(res.data),
-    };
+  /** PUT /api/products/:id — auth required */
+  updateProduct: async (
+    id: string | number,
+    payload: Partial<ProductMutationPayload>
+  ): Promise<ApiEnvelope<Product>> => {
+    const res = await apiClient.put<unknown, ApiEnvelope<RawProduct>>(`/products/${id}`, payload);
+    return { ...res, data: normalizeProduct(res.data) };
   },
 
-  deleteProduct: async (id: number | string): Promise<void> => {
+  /** DELETE /api/products/:id — auth required */
+  deleteProduct: async (id: string | number): Promise<void> => {
     await apiClient.delete(`/products/${id}`);
   },
 };
