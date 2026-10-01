import { ConfirmModal, Loading, Pagination, UserRow } from "@/components";
import { Seo } from "@/components/seo";
import { deleteUser, getUsers, restoreUser } from "@/data/users";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";

const Users = () => {
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);

  const queryClient = useQueryClient();

  const { isLoading, isError, data, error } = useQuery({
    queryKey: ["users", { page }],
    queryFn: () => getUsers(page),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setSelectedUser(null);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => restoreUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      handleCloseModal();
    },
  });

  const handleCloseModal = () => {
    setSelectedUser(null);
    setIsDeleteOpen(false);
    setIsRestoreOpen(false);
  };

  const handleDelete = (id: string) => deleteMutation.mutate(id);
  const handleRestore = (id: string) => restoreMutation.mutate(id);

  const errorMessage =
    deleteMutation.error || restoreMutation.error
      ? "Action failed. Please try again."
      : null;

  if (isLoading) return <Loading />;
  if (isError) return <div className="alert alert-error">{error.message}</div>;
  return (
    <>
      <Seo title="User list" index={false} />
      <section className="overflow-x-auto py-5">
        <h1 className="flex justify-start text-2xl font-semibold">Users</h1>

        <div className="flex justify-end text-xs font-semibold">
          Total users: {data?.pagination?.total}
        </div>

        {errorMessage && (
          <div className="alert alert-error mb-4">{errorMessage}</div>
        )}
        {data?.data?.length === 0 ? (
          <div className="alert alert-info">No users found.</div>
        ) : (
          <>
            <table className="table">
              {/* head */}
              <thead>
                <tr>
                  <th></th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Deleted At</th>
                </tr>
              </thead>
              <tbody>
                {data?.data?.map((user, index) => (
                  <UserRow
                    key={user.id}
                    index={(page - 1) * data.pagination.limit + index + 1}
                    user={user}
                    onDelete={() => {
                      setSelectedUser(user);
                      setIsDeleteOpen(true);
                    }}
                    onRestore={() => {
                      setSelectedUser(user);
                      setIsRestoreOpen(true);
                    }}
                  />
                ))}
              </tbody>
            </table>
            <Pagination
              page={page}
              totalPages={data?.pagination.totalPages ?? 1}
              onPageChange={setPage}
            />
          </>
        )}
        {selectedUser && isDeleteOpen && (
          <ConfirmModal
            title={
              selectedUser.name ??
              `${selectedUser.firstName ?? ""} ${selectedUser.lastName ?? ""}`.trim()
            }
            message="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(selectedUser.id)}
            onClose={handleCloseModal}
            isLoading={deleteMutation.isPending}
          />
        )}

        {selectedUser && isRestoreOpen && (
          <ConfirmModal
            title={
              selectedUser.name ??
              `${selectedUser.firstName ?? ""} ${selectedUser.lastName ?? ""}`.trim()
            }
            message="Are you sure you want to restore this user?"
            onConfirm={() => handleRestore(selectedUser.id)}
            onClose={handleCloseModal}
            isLoading={restoreMutation.isPending}
          />
        )}
      </section>
    </>
  );
};

export default Users;
