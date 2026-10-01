type UserRowProps = {
  index: number;
  user: User;
  onDelete: () => void;
  onRestore: () => void;
};

const UserRow = ({ index, user, onDelete, onRestore }: UserRowProps) => {
  return (
    <tr>
      <th>{index}</th>
      <td>
        {user.firstName} {user.lastName}
      </td>
      <td>{user.email}</td>
      <td>{user.role}</td>
      <td>
        {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
      </td>
      <td>
        {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "-"}
      </td>
      <td>
        {user.deletedAt ? new Date(user.deletedAt).toLocaleString() : "-"}
      </td>
      <th>
        <div className="flex justify-end gap-3">
          {!user.deletedAt ? (
            <button onClick={onDelete} className="btn btn-error btn-xs">
              delete
            </button>
          ) : (
            <button onClick={onRestore} className="btn btn-success btn-xs">
              restore
            </button>
          )}
        </div>
      </th>
    </tr>
  );
};

export default UserRow;
