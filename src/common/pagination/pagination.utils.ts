export interface PaginationParams {
  page?: number;
  perPage?: number;
}

export function getPaginationOptions({ page = 1, perPage = 10 }: PaginationParams) {
  const take = perPage;
  const skip = (page - 1) * take;
  return { take, skip };
}

export function formatPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  perPage: number,
) {
  return {
    items,
    pagination: {
      total,
      perPage,
      currentPage: page,
      lastPage: Math.ceil(total / perPage),
    },
  };
}

export function formatNoDataResponse(message = 'No records found.') {
  return {
    success: false,
    items: [],
    pagination: {
      total: 0,
      perPage: 1,
      currentPage: 1,
      lastPage: 1,
    },
    message,
  };
}
