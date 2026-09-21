import { useCallback, useEffect, useState } from "react";

/**
 * Gère le chargement paginé d'une liste depuis l'API (page/pageSize côté serveur)
 * et expose un objet `pagination` directement utilisable par <Table> d'Ant Design.
 */
export function usePaginatedList(listFn, params = {}) {

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const paramsKey = JSON.stringify(params);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const res = await listFn({ ...JSON.parse(paramsKey), page, limit: pageSize });
            setData(res.data || []);
            setTotal(res.pagination?.total ?? (res.data || []).length);
        } catch (err) {
            setError(err.response?.data?.message || "Erreur de chargement.");
        } finally {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, paramsKey]);

    useEffect(() => {
        load();
    }, [load]);

    const pagination = {
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        pageSizeOptions: [10, 20, 50],
        showTotal: (t) => `${t} résultat${t > 1 ? "s" : ""}`,
        onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
        }
    };

    return { data, loading, error, pagination, reload: load, setPage };
}
