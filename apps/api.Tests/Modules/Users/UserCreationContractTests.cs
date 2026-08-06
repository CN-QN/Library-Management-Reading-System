using api.Users.DTOs;
using FluentAssertions;
using Xunit;

namespace api.Tests.Modules.Users;

public sealed class UserCreationContractTests
{
    [Fact]
    public void Create_user_request_does_not_expose_student_code()
    {
        typeof(CreateUserRequest).GetProperties().Select(property => property.Name)
            .Should().BeEquivalentTo(["Email", "Password", "FullName", "BranchId"]);
    }

    [Fact]
    public void Branch_option_contract_contains_only_selection_fields()
    {
        typeof(BranchOptionDto).GetProperties().Select(property => property.Name)
            .Should().BeEquivalentTo(["Id", "Code", "Name"]);
    }
}
