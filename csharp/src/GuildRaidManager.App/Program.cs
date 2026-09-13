var jogadores = new List<object>();
var raids = new List<object>();
var encerrar = false;

while (!encerrar)
{
    Console.WriteLine();
    Console.WriteLine("=== Guild Raid Manager ===");
    Console.WriteLine($"Em memória: {jogadores.Count} jogador(es), {raids.Count} raid(s).");
    Console.WriteLine("1. Cadastrar jogador");
    Console.WriteLine("2. Listar jogadores");
    Console.WriteLine("3. Criar raid");
    Console.WriteLine("4. Listar raids");
    Console.WriteLine("5. Inscrever jogador em raid");
    Console.WriteLine("6. Remover inscrição");
    Console.WriteLine("7. Registrar presença");
    Console.WriteLine("8. Registrar loot");
    Console.WriteLine("9. Distribuir loot");
    Console.WriteLine("10. Consultar histórico");
    Console.WriteLine("0. Sair");
    Console.Write("Opção: ");

    var opcao = Console.ReadLine();

    switch (opcao)
    {
        case "0":
            encerrar = true;
            break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
        case "10":
            Console.WriteLine("Não implementado.");
            break;
        case null:
            encerrar = true;
            break;
        default:
            Console.WriteLine("Opção inválida.");
            break;
    }
}
