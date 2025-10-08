"""
データベース拡張メソッド
database.pyに追加する顧客管理、ナレッジ、キャンペーン関連のメソッド

使用方法:
このファイルのメソッドをdatabase.pyのDatabaseクラスにコピー&ペーストしてください
"""

# ==================== 顧客管理 ====================

async def get_customers(
    self,
    tenant_id: str,
    search: Optional[str] = None,
    tag_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[dict]:
    """顧客一覧取得"""
    async with self.pool.acquire() as conn:
        query = """
            SELECT DISTINCT c.*, 
                COALESCE(
                    json_agg(
                        json_build_object('id', t.id, 'name', t.name, 'color', t.color)
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'
                ) as tags
            FROM customers c
            LEFT JOIN customer_tags ct ON c.id = ct.customer_id
            LEFT JOIN tags t ON ct.tag_id = t.id
            WHERE c.tenant_id = $1
        """
        params = [tenant_id]
        param_count = 1
        
        if search:
            param_count += 1
            query += f" AND (c.last_name ILIKE ${param_count} OR c.first_name ILIKE ${param_count} OR c.phone_number ILIKE ${param_count})"
            params.append(f"%{search}%")
        
        if tag_id:
            param_count += 1
            query += f" AND EXISTS (SELECT 1 FROM customer_tags WHERE customer_id = c.id AND tag_id = ${param_count})"
            params.append(tag_id)
        
        query += f" GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${param_count + 1} OFFSET ${param_count + 2}"
        params.extend([limit, offset])
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

async def get_customers_count(self, tenant_id: str, search: Optional[str] = None, tag_id: Optional[str] = None) -> int:
    """顧客数取得"""
    async with self.pool.acquire() as conn:
        query = "SELECT COUNT(DISTINCT c.id) FROM customers c WHERE c.tenant_id = $1"
        params = [tenant_id]
        param_count = 1
        
        if search:
            param_count += 1
            query += f" AND (c.last_name ILIKE ${param_count} OR c.first_name ILIKE ${param_count} OR c.phone_number ILIKE ${param_count})"
            params.append(f"%{search}%")
        
        if tag_id:
            param_count += 1
            query += f" AND EXISTS (SELECT 1 FROM customer_tags WHERE customer_id = c.id AND tag_id = ${param_count})"
            params.append(tag_id)
        
        return await conn.fetchval(query, *params)

async def get_customer(self, customer_id: str, tenant_id: str) -> Optional[dict]:
    """顧客詳細取得"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT c.*, 
                COALESCE(
                    json_agg(
                        json_build_object('id', t.id, 'name', t.name, 'color', t.color)
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'
                ) as tags
            FROM customers c
            LEFT JOIN customer_tags ct ON c.id = ct.customer_id
            LEFT JOIN tags t ON ct.tag_id = t.id
            WHERE c.id = $1 AND c.tenant_id = $2
            GROUP BY c.id
        """, customer_id, tenant_id)
        return dict(row) if row else None

async def get_customer_by_phone(self, phone_number: str, tenant_id: str) -> Optional[dict]:
    """電話番号から顧客取得"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM customers WHERE phone_number = $1 AND tenant_id = $2",
            phone_number, tenant_id
        )
        return dict(row) if row else None

async def create_customer(self, tenant_id: str, **kwargs) -> dict:
    """顧客作成"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO customers (
                tenant_id, last_name, first_name, last_name_kana, first_name_kana,
                phone_number, fax_number, email, postal_code, prefecture, address, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
        """, tenant_id, kwargs.get('last_name'), kwargs.get('first_name'),
            kwargs.get('last_name_kana'), kwargs.get('first_name_kana'),
            kwargs.get('phone_number'), kwargs.get('fax_number'), kwargs.get('email'),
            kwargs.get('postal_code'), kwargs.get('prefecture'), kwargs.get('address'), kwargs.get('notes'))
        return dict(row)

async def update_customer(self, customer_id: str, tenant_id: str, data: dict):
    """顧客更新"""
    async with self.pool.acquire() as conn:
        fields = ', '.join([f"{k} = ${i+3}" for i, k in enumerate(data.keys())])
        query = f"UPDATE customers SET {fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2"
        await conn.execute(query, customer_id, tenant_id, *data.values())

async def delete_customer(self, customer_id: str, tenant_id: str):
    """顧客削除"""
    async with self.pool.acquire() as conn:
        await conn.execute("DELETE FROM customers WHERE id = $1 AND tenant_id = $2", customer_id, tenant_id)

async def add_customer_tags(self, customer_id: str, tag_ids: List[str]):
    """顧客タグ追加"""
    async with self.pool.acquire() as conn:
        await conn.executemany(
            "INSERT INTO customer_tags (customer_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [(customer_id, tag_id) for tag_id in tag_ids]
        )

async def remove_customer_tags(self, customer_id: str):
    """顧客タグ削除"""
    async with self.pool.acquire() as conn:
        await conn.execute("DELETE FROM customer_tags WHERE customer_id = $1", customer_id)

async def get_customer_call_history(self, customer_id: str, limit: int = 50, offset: int = 0) -> List[dict]:
    """顧客の通話履歴取得"""
    async with self.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT cs.* FROM call_sessions cs
            JOIN customers c ON (cs.from_number = c.phone_number OR cs.to_number = c.phone_number)
            WHERE c.id = $1
            ORDER BY cs.start_time DESC
            LIMIT $2 OFFSET $3
        """, customer_id, limit, offset)
        return [dict(row) for row in rows]

async def get_customer_call_history_count(self, customer_id: str) -> int:
    """顧客の通話履歴数取得"""
    async with self.pool.acquire() as conn:
        return await conn.fetchval("""
            SELECT COUNT(*) FROM call_sessions cs
            JOIN customers c ON (cs.from_number = c.phone_number OR cs.to_number = c.phone_number)
            WHERE c.id = $1
        """, customer_id)

# ==================== タグ管理 ====================

async def get_tags(self, tenant_id: str) -> List[dict]:
    """タグ一覧取得"""
    async with self.pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM tags WHERE tenant_id = $1 ORDER BY name", tenant_id)
        return [dict(row) for row in rows]

async def create_tag(self, tenant_id: str, name: str, color: str) -> dict:
    """タグ作成"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO tags (tenant_id, name, color) VALUES ($1, $2, $3) RETURNING *",
            tenant_id, name, color
        )
        return dict(row)

async def update_tag(self, tag_id: str, tenant_id: str, data: dict) -> Optional[dict]:
    """タグ更新"""
    async with self.pool.acquire() as conn:
        fields = ', '.join([f"{k} = ${i+3}" for i, k in enumerate(data.keys())])
        query = f"UPDATE tags SET {fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2 RETURNING *"
        row = await conn.fetchrow(query, tag_id, tenant_id, *data.values())
        return dict(row) if row else None

async def delete_tag(self, tag_id: str, tenant_id: str):
    """タグ削除"""
    async with self.pool.acquire() as conn:
        await conn.execute("DELETE FROM tags WHERE id = $1 AND tenant_id = $2", tag_id, tenant_id)

# ==================== ナレッジ管理 ====================

async def get_knowledge_articles(
    self, tenant_id: str, search: Optional[str] = None, category_id: Optional[str] = None,
    tag_id: Optional[str] = None, limit: int = 50, offset: int = 0
) -> List[dict]:
    """ナレッジ記事一覧取得"""
    async with self.pool.acquire() as conn:
        query = """
            SELECT DISTINCT ka.*,
                COALESCE(
                    json_agg(
                        json_build_object('id', t.id, 'name', t.name, 'color', t.color)
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'
                ) as tags
            FROM knowledge_articles ka
            LEFT JOIN knowledge_article_tags kat ON ka.id = kat.article_id
            LEFT JOIN tags t ON kat.tag_id = t.id
            WHERE ka.tenant_id = $1
        """
        params = [tenant_id]
        param_count = 1
        
        if search:
            param_count += 1
            query += f" AND (ka.title ILIKE ${param_count} OR ka.content ILIKE ${param_count})"
            params.append(f"%{search}%")
        
        if category_id:
            param_count += 1
            query += f" AND ka.category_id = ${param_count}"
            params.append(category_id)
        
        if tag_id:
            param_count += 1
            query += f" AND EXISTS (SELECT 1 FROM knowledge_article_tags WHERE article_id = ka.id AND tag_id = ${param_count})"
            params.append(tag_id)
        
        query += f" GROUP BY ka.id ORDER BY ka.relevance_score DESC, ka.created_at DESC LIMIT ${param_count + 1} OFFSET ${param_count + 2}"
        params.extend([limit, offset])
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

async def get_knowledge_articles_count(
    self, tenant_id: str, search: Optional[str] = None, category_id: Optional[str] = None, tag_id: Optional[str] = None
) -> int:
    """ナレッジ記事数取得"""
    async with self.pool.acquire() as conn:
        query = "SELECT COUNT(DISTINCT ka.id) FROM knowledge_articles ka WHERE ka.tenant_id = $1"
        params = [tenant_id]
        param_count = 1
        
        if search:
            param_count += 1
            query += f" AND (ka.title ILIKE ${param_count} OR ka.content ILIKE ${param_count})"
            params.append(f"%{search}%")
        
        if category_id:
            param_count += 1
            query += f" AND ka.category_id = ${param_count}"
            params.append(category_id)
        
        if tag_id:
            param_count += 1
            query += f" AND EXISTS (SELECT 1 FROM knowledge_article_tags WHERE article_id = ka.id AND tag_id = ${param_count})"
            params.append(tag_id)
        
        return await conn.fetchval(query, *params)

async def get_knowledge_article(self, article_id: str, tenant_id: str) -> Optional[dict]:
    """ナレッジ記事詳細取得"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT ka.*,
                COALESCE(
                    json_agg(
                        json_build_object('id', t.id, 'name', t.name, 'color', t.color)
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'
                ) as tags
            FROM knowledge_articles ka
            LEFT JOIN knowledge_article_tags kat ON ka.id = kat.article_id
            LEFT JOIN tags t ON kat.tag_id = t.id
            WHERE ka.id = $1 AND ka.tenant_id = $2
            GROUP BY ka.id
        """, article_id, tenant_id)
        return dict(row) if row else None

async def create_knowledge_article(self, tenant_id: str, **kwargs) -> dict:
    """ナレッジ記事作成"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO knowledge_articles (tenant_id, category_id, title, content, relevance_score)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """, tenant_id, kwargs.get('category_id'), kwargs.get('title'),
            kwargs.get('content'), kwargs.get('relevance_score', 0.0))
        return dict(row)

async def update_knowledge_article(self, article_id: str, tenant_id: str, data: dict):
    """ナレッジ記事更新"""
    async with self.pool.acquire() as conn:
        fields = ', '.join([f"{k} = ${i+3}" for i, k in enumerate(data.keys())])
        query = f"UPDATE knowledge_articles SET {fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2"
        await conn.execute(query, article_id, tenant_id, *data.values())

async def delete_knowledge_article(self, article_id: str, tenant_id: str):
    """ナレッジ記事削除"""
    async with self.pool.acquire() as conn:
        await conn.execute("DELETE FROM knowledge_articles WHERE id = $1 AND tenant_id = $2", article_id, tenant_id)

async def add_article_tags(self, article_id: str, tag_ids: List[str]):
    """記事タグ追加"""
    async with self.pool.acquire() as conn:
        await conn.executemany(
            "INSERT INTO knowledge_article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [(article_id, tag_id) for tag_id in tag_ids]
        )

async def remove_article_tags(self, article_id: str):
    """記事タグ削除"""
    async with self.pool.acquire() as conn:
        await conn.execute("DELETE FROM knowledge_article_tags WHERE article_id = $1", article_id)

# ==================== お問い合わせ管理 ====================

async def get_customer_inquiries(
    self, tenant_id: str, customer_id: Optional[str] = None, status: Optional[str] = None,
    priority: Optional[str] = None, limit: int = 50, offset: int = 0
) -> List[dict]:
    """お問い合わせ一覧取得"""
    async with self.pool.acquire() as conn:
        query = """
            SELECT DISTINCT ci.*,
                json_build_object(
                    'id', c.id, 'last_name', c.last_name, 'first_name', c.first_name,
                    'phone_number', c.phone_number
                ) as customer,
                COALESCE(
                    json_agg(
                        json_build_object('id', t.id, 'name', t.name, 'color', t.color)
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'
                ) as tags
            FROM customer_inquiries ci
            JOIN customers c ON ci.customer_id = c.id
            LEFT JOIN inquiry_tags it ON ci.id = it.inquiry_id
            LEFT JOIN tags t ON it.tag_id = t.id
            WHERE ci.tenant_id = $1
        """
        params = [tenant_id]
        param_count = 1
        
        if customer_id:
            param_count += 1
            query += f" AND ci.customer_id = ${param_count}"
            params.append(customer_id)
        
        if status:
            param_count += 1
            query += f" AND ci.status = ${param_count}"
            params.append(status)
        
        if priority:
            param_count += 1
            query += f" AND ci.priority = ${param_count}"
            params.append(priority)
        
        query += f" GROUP BY ci.id, c.id ORDER BY ci.created_at DESC LIMIT ${param_count + 1} OFFSET ${param_count + 2}"
        params.extend([limit, offset])
        
        rows = await conn.fetch(query, *params)
        return [dict(row) for row in rows]

async def get_customer_inquiries_count(
    self, tenant_id: str, customer_id: Optional[str] = None, status: Optional[str] = None, priority: Optional[str] = None
) -> int:
    """お問い合わせ数取得"""
    async with self.pool.acquire() as conn:
        query = "SELECT COUNT(*) FROM customer_inquiries WHERE tenant_id = $1"
        params = [tenant_id]
        param_count = 1
        
        if customer_id:
            param_count += 1
            query += f" AND customer_id = ${param_count}"
            params.append(customer_id)
        
        if status:
            param_count += 1
            query += f" AND status = ${param_count}"
            params.append(status)
        
        if priority:
            param_count += 1
            query += f" AND priority = ${param_count}"
            params.append(priority)
        
        return await conn.fetchval(query, *params)

async def get_customer_inquiry(self, inquiry_id: str, tenant_id: str) -> Optional[dict]:
    """お問い合わせ詳細取得"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow("""
            SELECT ci.*,
                json_build_object(
                    'id', c.id, 'last_name', c.last_name, 'first_name', c.first_name,
                    'phone_number', c.phone_number
                ) as customer,
                COALESCE(
                    json_agg(
                        json_build_object('id', t.id, 'name', t.name, 'color', t.color)
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'
                ) as tags
            FROM customer_inquiries ci
            JOIN customers c ON ci.customer_id = c.id
            LEFT JOIN inquiry_tags it ON ci.id = it.inquiry_id
            LEFT JOIN tags t ON it.tag_id = t.id
            WHERE ci.id = $1 AND ci.tenant_id = $2
            GROUP BY ci.id, c.id
        """, inquiry_id, tenant_id)
        return dict(row) if row else None

async def create_customer_inquiry(self, tenant_id: str, **kwargs) -> dict:
    """お問い合わせ作成"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO customer_inquiries (
                tenant_id, customer_id, call_session_id, category_id, summary,
                call_duration, status, priority
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        """, tenant_id, kwargs.get('customer_id'), kwargs.get('call_session_id'),
            kwargs.get('category_id'), kwargs.get('summary'), kwargs.get('call_duration'),
            kwargs.get('status', 'open'), kwargs.get('priority', 'medium'))
        return dict(row)

async def update_customer_inquiry(self, inquiry_id: str, tenant_id: str, data: dict):
    """お問い合わせ更新"""
    async with self.pool.acquire() as conn:
        fields = ', '.join([f"{k} = ${i+3}" for i, k in enumerate(data.keys())])
        query = f"UPDATE customer_inquiries SET {fields}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2"
        await conn.execute(query, inquiry_id, tenant_id, *data.values())

async def add_inquiry_tags(self, inquiry_id: str, tag_ids: List[str]):
    """お問い合わせタグ追加"""
    async with self.pool.acquire() as conn:
        await conn.executemany(
            "INSERT INTO inquiry_tags (inquiry_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [(inquiry_id, tag_id) for tag_id in tag_ids]
        )

async def remove_inquiry_tags(self, inquiry_id: str):
    """お問い合わせタグ削除"""
    async with self.pool.acquire() as conn:
        await conn.execute("DELETE FROM inquiry_tags WHERE inquiry_id = $1", inquiry_id)

# ==================== カテゴリー管理 ====================

async def get_knowledge_categories(self, tenant_id: str) -> List[dict]:
    """カテゴリー一覧取得"""
    async with self.pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM knowledge_categories WHERE tenant_id = $1 ORDER BY name", tenant_id)
        return [dict(row) for row in rows]

async def create_knowledge_category(self, tenant_id: str, name: str, description: Optional[str] = None) -> dict:
    """カテゴリー作成"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO knowledge_categories (tenant_id, name, description) VALUES ($1, $2, $3) RETURNING *",
            tenant_id, name, description
        )
        return dict(row)

async def delete_knowledge_category(self, category_id: str, tenant_id: str):
    """カテゴリー削除"""
    async with self.pool.acquire() as conn:
        await conn.execute("DELETE FROM knowledge_categories WHERE id = $1 AND tenant_id = $2", category_id, tenant_id)

# ==================== AI架電テンプレート ====================

async def get_call_templates(self, tenant_id: str) -> List[dict]:
    """テンプレート一覧取得"""
    async with self.pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM call_templates WHERE tenant_id = $1 ORDER BY name", tenant_id)
        return [dict(row) for row in rows]

async def create_call_template(self, tenant_id: str, **kwargs) -> dict:
    """テンプレート作成"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO call_templates (tenant_id, name, type, content, audio_url, description)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        """, tenant_id, kwargs.get('name'), kwargs.get('type'), kwargs.get('content'),
            kwargs.get('audio_url'), kwargs.get('description'))
        return dict(row)

async def delete_call_template(self, template_id: str, tenant_id: str):
    """テンプレート削除"""
    async with self.pool.acquire() as conn:
        await conn.execute("DELETE FROM call_templates WHERE id = $1 AND tenant_id = $2", template_id, tenant_id)

# ==================== AI架電キャンペーン ====================

async def get_call_campaigns(self, tenant_id: str, status: Optional[str] = None, limit: int = 50, offset: int = 0) -> List[dict]:
    """キャンペーン一覧取得"""
    async with self.pool.acquire() as conn:
        if status:
            rows = await conn.fetch("""
                SELECT * FROM call_campaigns
                WHERE tenant_id = $1 AND status = $2
                ORDER BY created_at DESC
                LIMIT $3 OFFSET $4
            """, tenant_id, status, limit, offset)
        else:
            rows = await conn.fetch("""
                SELECT * FROM call_campaigns
                WHERE tenant_id = $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            """, tenant_id, limit, offset)
        return [dict(row) for row in rows]

async def get_call_campaigns_count(self, tenant_id: str, status: Optional[str] = None) -> int:
    """キャンペーン数取得"""
    async with self.pool.acquire() as conn:
        if status:
            return await conn.fetchval("SELECT COUNT(*) FROM call_campaigns WHERE tenant_id = $1 AND status = $2", tenant_id, status)
        return await conn.fetchval("SELECT COUNT(*) FROM call_campaigns WHERE tenant_id = $1", tenant_id)

async def create_call_campaign(
    self, tenant_id: str, template_id: str, name: str, customer_ids: List[str], scheduled_at: Optional[datetime] = None
) -> dict:
    """キャンペーン作成"""
    async with self.pool.acquire() as conn:
        # キャンペーン作成
        row = await conn.fetchrow("""
            INSERT INTO call_campaigns (tenant_id, template_id, name, total_targets, scheduled_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """, tenant_id, template_id, name, len(customer_ids), scheduled_at)
        
        campaign_id = row['id']
        
        # キャンペーンログエントリ作成
        await conn.executemany("""
            INSERT INTO call_campaign_logs (campaign_id, customer_id, status)
            VALUES ($1, $2, 'pending')
        """, [(campaign_id, customer_id) for customer_id in customer_ids])
        
        return dict(row)

async def update_campaign_status(self, campaign_id: str, tenant_id: str, status: str, **kwargs):
    """キャンペーンステータス更新"""
    async with self.pool.acquire() as conn:
        set_clause = "status = $3"
        params = [campaign_id, tenant_id, status]
        param_count = 3
        
        if 'started_at' in kwargs:
            param_count += 1
            set_clause += f", started_at = ${param_count}"
            params.append(kwargs['started_at'])
        
        if 'completed_at' in kwargs:
            param_count += 1
            set_clause += f", completed_at = ${param_count}"
            params.append(kwargs['completed_at'])
        
        query = f"UPDATE call_campaigns SET {set_clause}, updated_at = NOW() WHERE id = $1 AND tenant_id = $2"
        await conn.execute(query, *params)

async def get_campaign_logs(self, campaign_id: str, limit: int = 50, offset: int = 0) -> List[dict]:
    """キャンペーンログ取得"""
    async with self.pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT ccl.*,
                json_build_object(
                    'id', c.id, 'last_name', c.last_name, 'first_name', c.first_name,
                    'phone_number', c.phone_number
                ) as customer
            FROM call_campaign_logs ccl
            JOIN customers c ON ccl.customer_id = c.id
            WHERE ccl.campaign_id = $1
            ORDER BY ccl.attempted_at DESC
            LIMIT $2 OFFSET $3
        """, campaign_id, limit, offset)
        return [dict(row) for row in rows]

async def get_campaign_logs_count(self, campaign_id: str) -> int:
    """キャンペーンログ数取得"""
    async with self.pool.acquire() as conn:
        return await conn.fetchval("SELECT COUNT(*) FROM call_campaign_logs WHERE campaign_id = $1", campaign_id)

# ==================== テナント管理 ====================

async def get_all_tenants(self) -> List[dict]:
    """全テナント取得"""
    async with self.pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM tenants ORDER BY created_at DESC")
        return [dict(row) for row in rows]

async def create_tenant(self, **kwargs) -> dict:
    """テナント作成"""
    async with self.pool.acquire() as conn:
        row = await conn.fetchrow("""
            INSERT INTO tenants (name, azure_speech_key, azure_speech_region, dify_api_key, dify_endpoint)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        """, kwargs.get('name'), kwargs.get('azure_speech_key'), kwargs.get('azure_speech_region'),
            kwargs.get('dify_api_key'), kwargs.get('dify_endpoint'))
        return dict(row)

async def update_tenant(self, tenant_id: str, data: dict) -> Optional[dict]:
    """テナント更新"""
    async with self.pool.acquire() as conn:
        fields = ', '.join([f"{k} = ${i+2}" for i, k in enumerate(data.keys())])
        query = f"UPDATE tenants SET {fields} WHERE id = $1 RETURNING *"
        row = await conn.fetchrow(query, tenant_id, *data.values())
        return dict(row) if row else None

async def delete_tenant(self, tenant_id: str):
    """テナント削除"""
    async with self.pool.acquire() as conn:
        await conn.execute("DELETE FROM tenants WHERE id = $1", tenant_id)

